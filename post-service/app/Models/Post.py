from datetime import datetime
from pydantic import BaseModel
from typing import Optional
from enum import Enum

class PostVisibility(Enum):
    PRIVATE = 0
    PUBLIC = 1
    FRIENDS = 2


class Post(BaseModel):
    content: str
    visibility: PostVisibility
    createdAt: Optional[datetime] = datetime.now()
    isStory: bool = False
    creatorId: str
    isDelete: bool = False

class PostRequest(Post):
    pass

class PostResponse(Post):
    id: str

    @staticmethod
    def from_mongo(documents):
        for document in documents:
            document["id"] = str(document["_id"])
            document.pop("_id")
        return [PostResponse(**document) for document in documents]
