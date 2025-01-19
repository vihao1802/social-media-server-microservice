from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class CommentReaction(BaseModel):
    commentId: str
    userId: str
    createdAt: Optional[datetime] = datetime.now()

class CommentReactionRequest(CommentReaction):
    pass

class CommentReactionResponse(CommentReaction):
    id: str