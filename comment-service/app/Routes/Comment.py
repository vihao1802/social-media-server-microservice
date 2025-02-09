from datetime import datetime
from typing import Optional, Annotated
from bson import ObjectId
from fastapi import APIRouter, status, UploadFile, File, HTTPException
from fastapi_pagination import Page
from fastapi_pagination.ext.motor import paginate
from app.Config.minio_client import service_preflex, bucket_name, minio_client
from app.Database.database import comments_collection
from app.Models.Comment import CommentResponse, CommentUpdate, CommentModeration, TypeModeration
from app.Utils.ContentModeration import content_moderation
import base64

comment_router = APIRouter(prefix="/comments", tags=["Comments"])

@comment_router.get("/{post_id}", status_code=status.HTTP_200_OK, response_model=Page[CommentResponse])
async def get(post_id: str):
    return await paginate(comments_collection,{"postId": post_id}, transformer=CommentResponse.from_mongo)

@comment_router.post("", status_code=status.HTTP_201_CREATED, response_model=CommentResponse)
async def create(post_id: str,
                 user_id: str,
                 content: Optional[str] = None,
                 created_at: datetime = datetime.now(),
                 reply_to: Optional[str] = None,
                 media_file: Annotated[UploadFile | None, File()] = None):
    try:
        request_data = {
            "postId": post_id,
            "userId": user_id,
            "content": content,
            "createdAt": created_at,
            "replyTo": reply_to,
            "mediaUrl": None,
            "isDelete": False,
            "isEdited": False
        }

        list_moderation = [CommentModeration(content=content, type=TypeModeration.TEXT)] if content else []

        if media_file:
            # Handle image content moderation
            base64_image = base64.b64encode(await media_file.read()).decode("utf-8")
            image_str = f"data:{media_file.content_type};base64,{base64_image}"
            list_moderation.append(CommentModeration(content=image_str, type=TypeModeration.IMAGE_URL))

        if not list_moderation:
            raise HTTPException(status_code=400, detail="No content to moderate")

        if not content_moderation(list_moderation):
            # Save media file to Minio
            if media_file:
                media_url = f"{service_preflex}/{media_file.filename}"
                minio_client.put_object(bucket_name, media_url, media_file.file, -1,media_file.content_type, part_size=10*1024*1024)
                request_data["mediaUrl"] = f"{bucket_name}/{media_url}"

            # Insert comment to MongoDB
            result = await comments_collection.insert_one(request_data)
            return CommentResponse(id=str(result.inserted_id), **request_data)

    except HTTPException as http_e:
        raise http_e

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@comment_router.patch("/{comment_id}", status_code=status.HTTP_200_OK)
async def update(comment_id: str, comment: CommentUpdate):
    try:
        data = await comments_collection.find_one({"_id": ObjectId(comment_id)})
        if not data:
            raise HTTPException(status_code=404, detail="Comment not found")
        request_data = comment.dict(exclude_unset=True)
        await comments_collection.update_one({"_id": ObjectId(comment_id)}, {"$set": request_data})
        return {"message": "Comment updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

