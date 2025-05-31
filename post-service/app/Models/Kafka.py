from pydantic import BaseModel

class PostMessage(BaseModel):
    postId: str
    creatorId: str
