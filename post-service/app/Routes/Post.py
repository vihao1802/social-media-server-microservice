from fastapi import APIRouter, status
from app.Models.Post import Post
from app.Models.Post import PostResponse
from app.Database.database import post_collection
from fastapi_pagination import Page, Params
from fastapi_pagination.ext.pymongo import paginate
from bson import ObjectId

post_router = APIRouter(prefix="/posts", tags=["Posts"])


@post_router.get("", status_code=status.HTTP_200_OK, response_model=Page[Post])
async def all():
    return paginate(post_collection)


@post_router.get("/{post_id}", status_code=status.HTTP_200_OK)
async def get(post_id: str):
    post = post_collection.find_one({"_id": ObjectId(post_id)})
    post["_id"] = str(post["_id"])
    return post


@post_router.get(
    "/user/{creator_id}", status_code=status.HTTP_200_OK, response_model=Page[Post]
)
async def get(creator_id: str):
    return paginate(post_collection, {"creatorId": creator_id})


@post_router.post("/", status_code=status.HTTP_201_CREATED, response_model=PostResponse)
async def create(post: Post):
    request_data = post.dict()
    request_data["visibility"] = request_data["visibility"].value
    result = post_collection.insert_one(request_data)
    return PostResponse(id=str(result.inserted_id), **request_data)

@post_router.put("/{post_id}", status_code=status.HTTP_200_OK, response_model=PostResponse)
async def update(post_id: str, post: Post):
    request_data = post.dict()
    request_data["visibility"] = request_data["visibility"].value
    post_collection.update_one({"_id": ObjectId(post_id)}, {"$set": request_data})
    return PostResponse(id=post_id, **request_data)

@post_router.patch("/{post_id}", status_code=status.HTTP_200_OK)
async def delete(post_id: str):
    post_collection.update_one({"_id": ObjectId(post_id)}, {"$set": {"isDelete": True}})
    return {"message": "Post deleted successfully"}