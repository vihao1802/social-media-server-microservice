from datetime import datetime
from typing import Optional, Annotated
from bson import ObjectId
from fastapi import APIRouter, status, UploadFile, File, HTTPException, Request, Form
from fastapi_pagination import Page
from fastapi_pagination.ext.motor import paginate
from httpx import AsyncClient, RequestError

from app.Config.config import API_GATEWAY_URL
from app.Config.kafka_producer import kafka_producer
from app.Config.minio_client import service_preflex, bucket_name, minio_client
from app.Database.database import comments_collection, comment_reaction_collection
from app.Models.Comment import CommentResponse, CommentUpdate
from app.Utils.ContentModeration import content_moderation
from google.genai import types

comment_router = APIRouter(prefix="/comments", tags=["Comments"])

async def handle_comment_response(documents, token: str, current_user_id: str):
    async with AsyncClient() as client:
        results = []

        for document in documents:
            document["id"] = str(document["_id"])
            document.pop("_id")

            user_info = None
            user_id = document.get("userId")
            if user_id:
                try:
                    response = await client.get(
                        f"{API_GATEWAY_URL}/user/{user_id}",
                        headers={"Authorization": f"Bearer {token}"}
                    )
                    if response.status_code == 200:
                        user_info = response.json()

                        user_info = {
                            "id": user_info.get("id"),
                            "username": user_info.get("username"),
                            "profileImg": user_info.get("profileImg"),
                        }
                    else:
                        print(f"Failed to fetch user info for {user_id}: {response.status_code}")
                except RequestError as e:
                    print(f"Error fetching user info for {user_id}: {e}")

            document["user"] = user_info
            document["childCount"] = await comments_collection.count_documents(
                {"replyTo": document["id"]}
            )
            document["liked"] = await comment_reaction_collection.find_one({"userId": current_user_id, "commentId": document["id"]}) is not None
            document["likeCount"] = await comment_reaction_collection.count_documents(
                {"commentId": document["id"]}
            )

            results.append(CommentResponse(**document))

        return results

@comment_router.get("/post/{post_id}", status_code=status.HTTP_200_OK, response_model=Page[CommentResponse])
async def get_root_comments(post_id: str, request: Request):
    try:
        async def transformer_wrapper(items):
            return await handle_comment_response(items, token=request.state.token, current_user_id=request.state.user.get("id"))

        return await paginate(comments_collection, {"postId": post_id, "replyTo": None}, sort=("createdAt",-1), transformer=transformer_wrapper)
    except Exception as e:
        raise (HTTPException(status_code=500, detail=str(e)))

@comment_router.get("/{comment_id}/replies", status_code=status.HTTP_200_OK, response_model=Page[CommentResponse])
async def get_reply_comments(comment_id: str, request: Request):
    try:
        async def transformer_wrapper(items):
            return await handle_comment_response(items, token=request.state.token, current_user_id=request.state.user.get("id"))

        return await paginate(comments_collection, {"replyTo": comment_id}, transformer=transformer_wrapper)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@comment_router.post("", status_code=status.HTTP_201_CREATED, response_model=CommentResponse)
async def create(post_id: str = Form(...),
                 user_id: str = Form(...),
                 created_at: datetime = Form(datetime.now()),
                 content: str = Form(None),
                 reply_to: str = Form(None),
                 media_file: UploadFile = Form(None)):
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
