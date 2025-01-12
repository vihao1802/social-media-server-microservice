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
    isStory: bool
    creatorId: str
    isDelete: bool


class PostResponse(Post):
    id: str
