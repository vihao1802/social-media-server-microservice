from datetime import datetime

from fastapi import Request
from pydantic import BaseModel
from typing import Optional
from enum import Enum, IntEnum
from httpx import AsyncClient, RequestError

from app.Config.config import API_GATEWAY_URL
from app.Services.auth_service import verify_token


class PostVisibility(IntEnum):
    PRIVATE = 0
    PUBLIC = 1
    FRIENDS = 2


class Post(BaseModel):
    content: str
    visibility: PostVisibility
    createdAt: Optional[datetime] = datetime.now()
    isStory: bool = False
    creatorId: str
    isDeleted: bool = False

class PostRequest(Post):
    pass

class PostResponse(Post):
    id: str
    creator: Optional[dict] = None
    liked: Optional[bool] = False
    likeCount: Optional[int] = 0

