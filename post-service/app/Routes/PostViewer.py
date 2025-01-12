from fastapi import APIRouter, status
from app.Models.PostViewer import PostViewerRequest, PostViewerResponse
from app.Database.database import postViewer_collection
from bson import ObjectId


postViewer_router = APIRouter(prefix="/post_viewer", tags=["PostViewers"])


@postViewer_router.get(
    "/post/{post_id}",
    status_code=status.HTTP_200_OK,
    response_model=list[PostViewerResponse],
)
async def get(post_id: str):
    post_viewer = postViewer_collection.find(
        {"postId": post_id}
    )  # post_viewer is a cursor so we need to convert it to a list
    return [PostViewerResponse(id=str(pv["_id"]), **pv) for pv in list(post_viewer)]


@postViewer_router.post(
    "/", status_code=status.HTTP_201_CREATED, response_model=PostViewerResponse
)
async def create(request_data: PostViewerRequest):
    result = postViewer_collection.insert_one(request_data.dict())
    return PostViewerResponse(id=str(result.inserted_id), **request_data.dict())

@postViewer_router.patch("/{post_id}", status_code=status.HTTP_200_OK)
async def update(post_id: str, liked: bool):
    postViewer_collection.update_one({"_id": ObjectId(post_id)}, {"$set": {"liked": liked}})
    return {"message": "PostViewer updated successfully"}


