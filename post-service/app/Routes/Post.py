from fastapi import APIRouter, status, HTTPException
from app.Models.Post import PostRequest
from app.Models.Post import PostResponse
from app.Database.database import post_collection
from fastapi_pagination import Page
from fastapi_pagination.ext.motor import paginate
from bson import ObjectId


post_router = APIRouter(prefix="/posts", tags=["Posts"])

@post_router.get("", status_code=status.HTTP_200_OK, response_model=Page[PostResponse])
async def get():
    try:
        return await paginate(post_collection, transformer=PostResponse.from_mongo)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

@post_router.get("/{post_id}", status_code=status.HTTP_200_OK)
async def get(post_id: str):
    try:
        post = await post_collection.find_one({"_id": ObjectId(post_id)})

        if post is None:
            raise HTTPException(status_code=404, detail="Post not found")

        post["_id"] = str(post["_id"])

        return post
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@post_router.get(
    "/user/{creator_id}", status_code=status.HTTP_200_OK, response_model=Page[PostResponse]
)
async def get(creator_id: str):
    try:
        return await paginate(post_collection, {"creatorId": creator_id}, transformer=PostResponse.from_mongo)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

@post_router.get("/story/user/{user_id}", status_code=status.HTTP_200_OK, response_model=Page[PostResponse])
async def get(user_id: str):
    try:
        return await paginate(post_collection, {"creatorId": user_id, "isStory": True}, transformer=PostResponse.from_mongo)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

@post_router.post("", status_code=status.HTTP_201_CREATED, response_model=PostResponse)
async def create(post: PostRequest):
    try:
        request_data = post.dict()
        request_data["visibility"] = request_data["visibility"].value
        result = await post_collection.insert_one(request_data)

        return PostResponse(id=str(result.inserted_id), **request_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

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
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

@post_router.patch("/{post_id}", status_code=status.HTTP_200_OK)
async def delete(post_id: str):
    try:
        post = await post_collection.find_one({"_id": ObjectId(post_id)})

        if post is None:
            raise HTTPException(status_code=404, detail="Post not found")

        post_collection.update_one({"_id": ObjectId(post_id)}, {"$set": {"isDelete": True}})

        return {"message": "Post deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")