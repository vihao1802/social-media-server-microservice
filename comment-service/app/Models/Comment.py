from pydantic import BaseModel
from datetime import datetime
from typing import Optional

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
    user: Optional[dict] = None
    liked: Optional[bool] = False
    likeCount: Optional[int] = 0
    childCount: Optional[int] = 0


class CommentUpdate(BaseModel):
    content: Optional[str]
    isDelete: Optional[bool] = False
    isEdited: Optional[bool] = False
