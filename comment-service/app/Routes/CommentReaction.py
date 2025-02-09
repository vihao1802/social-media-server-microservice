from bson import ObjectId
from fastapi import APIRouter, status, HTTPException

from app.Database.database import comment_reaction_collection, comments_collection
from app.Models.CommentReaction import CommentReactionRequest, CommentReactionResponse

comment_reaction_router = APIRouter(prefix="/comment_reaction", tags=["Comment Reaction"])

@comment_reaction_router.post("", status_code=status.HTTP_201_CREATED, response_model=CommentReactionResponse)
async def create(request_data: CommentReactionRequest):
    try:
        data = request_data.dict()
        comment  = comments_collection.find_one({"_id": ObjectId(data["commentId"])})

        if not comment:
            raise HTTPException(status_code=404, detail="Comment not found")

        new_reaction = await comment_reaction_collection.insert_one(data)
        return CommentReactionResponse(id=str(new_reaction.inserted_id), **request_data.dict())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

@comment_reaction_router.delete("/{reaction_id}", status_code=status.HTTP_200_OK)
async def delete(reaction_id: str):
    try:
        data = await comment_reaction_collection.find_one({"_id": ObjectId(reaction_id)})
        if not data:
            raise HTTPException(status_code=404, detail="Reaction not found")
        await comment_reaction_collection.delete_one({"_id": ObjectId(reaction_id)})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")