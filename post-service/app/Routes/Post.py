import io
import this
from typing import List, Optional

from fastapi import APIRouter, status, HTTPException, Security, Request, Form, UploadFile, File
from fastapi.security import HTTPAuthorizationCredentials
from httpx import AsyncClient, RequestError
from pymongo.client_session import ClientSession
from datetime import datetime, timezone

from app.Config.config import API_GATEWAY_URL
from app.Config.minio_client import service_preflex, minio_client, bucket_name
from app.Models.Kafka import PostMessage
from app.Models.Moderation import Moderation
from app.Models.Post import PostRequest, PostVisibility
from app.Models.Post import PostResponse
from app.Database.database import post_collection, postViewer_collection, db, postMedia_collection
from fastapi_pagination import Page
from fastapi_pagination.ext.motor import paginate
from bson import ObjectId

from app.Models.PostMedia import MediaType, PostMediaResponse
from app.Services.auth_service import security
from app.Utils.ContentModeration import content_moderation
from app.Config.kafka_producer import kafka_producer

from google import genai
from google.genai import types

post_router = APIRouter(prefix="/posts", tags=["Posts"])

async def handle_post_response(documents, token: str, current_user_id: str):
    async with AsyncClient() as client:
        results = []

        for document in documents:
            document["id"] = str(document["_id"])
            document.pop("_id")

            document["liked"] = await postViewer_collection.find_one({
                "postId": document["id"],
                "userId": current_user_id,
            }) is not None

            document["likeCount"] = await postViewer_collection.count_documents(
                {"postId": document["id"]}
            )

            creator_info = None
            creator_id = document.get("creatorId")
            if creator_id:
                try:
                    response = await client.get(
                        f"{API_GATEWAY_URL}/user/{creator_id}",
                        headers={"Authorization": f"Bearer {token}"}
                    )
                    if response.status_code == 200:
                        creator_info = response.json()

                        creator_info = {
                            "id": creator_info.get("id"),
                            "username": creator_info.get("username"),
                            "profileImg": creator_info.get("profileImg"),
                        }
                    else:
                        print(f"Failed to fetch creator info for {creator_id}: {response.status_code}")
                except RequestError as e:
                    print(f"Error fetching creator info for {creator_id}: {e}")

            document["creator"] = creator_info
            results.append(PostResponse(**document))

        return results

@post_router.get("", status_code=status.HTTP_200_OK, response_model=Page[PostResponse])
async def get(request: Request):
    try:
        async def transformer_wrapper(items):
            return await handle_post_response(items, token=request.state.token, current_user_id=request.state.user.get("id"))

        return await paginate(post_collection, {"isDeleted": False}, sort=("createdAt",-1), transformer=transformer_wrapper)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@post_router.get("/{post_id}", status_code=status.HTTP_200_OK)
async def get(post_id: str):
    try:
        post = await post_collection.find_one({"_id": ObjectId(post_id)})

        if post is None:
            raise HTTPException(status_code=404, detail="Post not found")

        post["_id"] = str(post["_id"])

        return post
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@post_router.get(
    "/users/{creator_id}", status_code=status.HTTP_200_OK, response_model=Page[PostResponse]
)
async def get(creator_id: str):
    try:
        return await paginate(post_collection, {"creatorId": creator_id}, transformer=PostResponse.from_mongo)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@post_router.get("/users/{user_id}/stories/", status_code=status.HTTP_200_OK, response_model=Page[PostResponse])
async def get(user_id: str):
    try:
        return await paginate(post_collection, {"creatorId": user_id, "isStory": True}, transformer=PostResponse.from_mongo)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@post_router.get("/stories/following", status_code=status.HTTP_200_OK, response_model=Page[PostResponse])
async def get(credentials: HTTPAuthorizationCredentials = Security(security)):
    try:
        token = credentials.credentials
        relation_service_url = "http://relationship-service-container:8105/relationship/me/following?page=1&pageSize=100"

        async with AsyncClient() as client:
            try:
                response = await client.get(
                    relation_service_url,
                    headers={"Authorization": f"Bearer {token}"}
                )

                if response.status_code == 200:
                    following_data = response.json().get("data").get("data")

                    following_ids = [user["ReceiverId"] for user in following_data]

                    print(following_ids)
                    return await paginate(post_collection, {"creatorId": {"$in": following_ids}, "isStory": True, "visibility": {"$in": [1,2]}}, transformer=PostResponse.from_mongo)
                else:
                    raise HTTPException(status_code=500, detail="Error fetching following data")

            except HTTPException as http_e:
                raise http_e

            except RequestError as e:
            # Handle connection errors or other request-related issues
                raise HTTPException(
                    status_code=500,
                    detail=f"Error connecting to Auth service: {str(e)}"
                )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@post_router.post("", status_code=status.HTTP_201_CREATED, response_model=dict)
async def create(
        content: str = Form(...),
        visibility: PostVisibility = Form(...),
        is_story: bool = Form(False),
        creator_id: str = Form(...),
        is_deleted: bool = Form(False),
        media_types: List[MediaType] = Form(...),               # Danh sách loại media tương ứng
        media_files: List[UploadFile] = File(...),              # Danh sách file upload
):
    session: ClientSession = await db.client.start_session()
    async with session.start_transaction():
        try:
            # handle post creation
            if not await content_moderation(Moderation(content=content)):
                request_data = {
                    "content": content,
                    "visibility": visibility.value,
                    "isStory": is_story,
                    "isDeleted": is_deleted,
                    "creatorId": creator_id,
                    "createdAt": datetime.now(timezone.utc)
                }
                post_result = await post_collection.insert_one(request_data, session=session)
                post_id = str(post_result.inserted_id)

                # handle media creation
                if len(media_files) != len(media_types):
                    raise HTTPException(status_code=400, detail=f"Media file and type count mismatch: [{len(media_files)} != {len(media_types)}]")

                media_response_list = []

                noti_flag = False

                for file, mtype in zip(media_files, media_types):
                    data = await file.read()
                    if not await content_moderation(Moderation(file_data=data, file_content_type=file.content_type)):
                        # Save media file to Minio
                        noti_flag = True
                        media_url = f"{service_preflex}/{file.filename}"
                        file_len = len(data)
                        minio_client.put_object(bucket_name, media_url, io.BytesIO(data), file_len,file.content_type, part_size=10*1024*1024)

                        new_post_media = {
                            "mediaType": mtype.value,
                            "postId": post_id,
                            "mediaUrl": media_url
                        }

                        media_result = await postMedia_collection.insert_one(new_post_media, session=session)
                        media_response_list.append(PostMediaResponse(**new_post_media, id=str(media_result.inserted_id)))
                # handle kafka notification
                if noti_flag:
                    # Create a PostMessage object and send it to Kafka
                    post_message = PostMessage(postId=post_id, creatorId=request_data["creatorId"])
                    await kafka_producer.send(
                        topic="create-post",
                        message=post_message.dict(),
                        headers=[("__TypeId__", b"post-message")]
                    )

                    await session.commit_transaction()

                    return {
                        "post": PostResponse(id=post_id, **request_data),
                        "media": media_response_list
                    }

        except HTTPException as http_e:
            await session.abort_transaction()
            raise http_e

        except Exception as e:
            await session.abort_transaction()
            raise HTTPException(status_code=500, detail=str(e))
        finally:
            await session.end_session()

@post_router.put("/{post_id}", status_code=status.HTTP_200_OK, response_model=PostResponse)
async def update(post_id: str, request_data: PostRequest):
    try:
        post = await post_collection.find_one({"_id": ObjectId(post_id)})
        if post is None:
            raise HTTPException(status_code=404, detail="Post not found")

        post_data = request_data.dict()
        post_data["visibility"] = post_data["visibility"].value
        post_collection.update_one({"_id": ObjectId(post_id)}, {"$set": post_data})

        return PostResponse(id=post_id, **post_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@post_router.patch("/{post_id}", status_code=status.HTTP_200_OK)
async def delete(post_id: str):
    try:
        post = await post_collection.find_one({"_id": ObjectId(post_id)})

        if post is None:
            raise HTTPException(status_code=404, detail="Post not found")

        post_collection.update_one({"_id": ObjectId(post_id)}, {"$set": {"isDeleted": True}})

        return {"message": "Post deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))