from fastapi import APIRouter, status, HTTPException
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
    try:
        post_viewer = await postViewer_collection.find(
            {"postId": post_id}
        ).to_list()  # post_viewer is a cursor so we need to convert it to a list
        return [PostViewerResponse(id=str(pv["_id"]), **pv) for pv in post_viewer]
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"An unexpected error occurred: {str(e)}"
        )


@postViewer_router.post(
    "", status_code=status.HTTP_201_CREATED, response_model=PostViewerResponse
)
async def create(request_data: PostViewerRequest):
    try:
        find_exist = await postViewer_collection.find_one({"postId": request_data.postId, "userId": request_data.userId})
        if find_exist:
            raise HTTPException(
                status_code=400, detail="PostViewer already exists for this post and user"
            )

        result = await postViewer_collection.insert_one(request_data.dict())
        return PostViewerResponse(id=str(result.inserted_id), **request_data.dict())
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"An unexpected error occurred: {str(e)}"
        )

@postViewer_router.delete("/post/{post_id}/user/{user_id}", status_code=status.HTTP_200_OK)
async def update(post_id: str, user_id: str):
    try:
        await postViewer_collection.delete_one({"postId": post_id, "userId": user_id})
        return {"message": "PostViewer deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


