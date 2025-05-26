from fastapi import APIRouter, status, HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials
from httpx import AsyncClient, RequestError

from app.Models.Kafka import PostMessage
from app.Models.Moderation import Moderation
from app.Models.Post import PostRequest
from app.Models.Post import PostResponse
from app.Database.database import post_collection
from fastapi_pagination import Page
from fastapi_pagination.ext.motor import paginate
from bson import ObjectId

from app.Services.auth_service import security
from app.Utils.ContentModeration import content_moderation
from app.Config.kafka_producer import kafka_producer

from google import genai
from google.genai import types

post_router = APIRouter(prefix="/posts", tags=["Posts"])

@post_router.get("", status_code=status.HTTP_200_OK, response_model=Page[PostResponse])
async def get():
    try:
        return await paginate(post_collection, transformer=PostResponse.from_mongo)
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

@post_router.post("", status_code=status.HTTP_201_CREATED, response_model=PostResponse)
async def create(post: PostRequest):
    try:
        request_data = post.dict()
        request_data["visibility"] = request_data["visibility"].value

        if not await content_moderation(Moderation(content=request_data["content"])):
            result = await post_collection.insert_one(request_data)
            post_message = PostMessage(postId=str(result.inserted_id), creatorId=request_data["creatorId"])
            await kafka_producer.send(
                topic="create-post",
                message=post_message.dict(),
                headers=[("__TypeId__", b"post-message")]
            )
            return PostResponse(id=str(result.inserted_id), **request_data)
    except HTTPException as http_e:
        raise http_e

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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

        post_collection.update_one({"_id": ObjectId(post_id)}, {"$set": {"isDelete": True}})

        return {"message": "Post deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))