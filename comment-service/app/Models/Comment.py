from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from enum import Enum

class Comment(BaseModel):
    postId: str
    userId: str
    isDelete: bool = False
    isEdited: bool = False
    createdAt: datetime = datetime.now()
    content: Optional[str] = None
    mediaUrl: Optional[str] = None
    replyTo: Optional[str] = None

class CommentRequest(Comment):
    pass

class CommentResponse(Comment):
    id: str

    @staticmethod
    def from_mongo(documents):
        for document in documents:
            document["id"] = str(document["_id"])
            document.pop("_id")
        return [CommentResponse(**document) for document in documents]

class CommentUpdate(BaseModel):
    content: Optional[str]
    isDelete: Optional[bool] = False
    isEdited: Optional[bool] = False


class TypeModeration(Enum):
    TEXT = "text"
    IMAGE_URL = "image_url"

class CommentModeration(BaseModel):
    content: str
    type: TypeModeration
