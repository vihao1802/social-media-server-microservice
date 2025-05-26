from datetime import datetime
from typing import Optional, Annotated
from bson import ObjectId
from fastapi import APIRouter, status, UploadFile, File, HTTPException
from fastapi_pagination import Page
from fastapi_pagination.ext.motor import paginate

from app.Config.kafka_producer import kafka_producer
from app.Config.minio_client import service_preflex, bucket_name, minio_client
from app.Database.database import comments_collection
from app.Models.Comment import CommentResponse, CommentUpdate
from app.Utils.ContentModeration import content_moderation
from google.genai import types

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

        contents = [content, types.Part.from_bytes(
            data=await media_file.read(),
            mime_type=media_file.content_type
        )] if content and media_file else content if content else types.Part.from_bytes(
            data=await media_file.read(),
            mime_type=media_file.content_type
        ) if media_file else None

        if not content_moderation(contents):
            # Save media file to Minio
            if media_file:
                media_url = f"{service_preflex}/{media_file.filename}"
                minio_client.put_object(bucket_name, media_url, media_file.file, -1,media_file.content_type, part_size=10*1024*1024)
                request_data["mediaUrl"] = f"{bucket_name}/{media_url}"

            # Insert comment to MongoDB
            result = await comments_collection.insert_one(request_data)

            # kafka producer
            comment_message = {
                "id": str(result.inserted_id),
                "postId": post_id,
                "userId": user_id,
            }
            await kafka_producer.send(
                topic="create-comment",
                message=comment_message,
                headers=[("__TypeId__", b"comment-message")]
            )

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

