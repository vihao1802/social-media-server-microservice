from pydantic import BaseModel

class CommentMessage(BaseModel):
    postId: str
    userId: str
