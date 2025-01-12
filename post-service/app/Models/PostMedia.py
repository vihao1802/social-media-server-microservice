from fastapi import UploadFile, File, Form
from pydantic import BaseModel
from enum import Enum

class MediaType(Enum):
    IMAGE = "IMAGE"
    VIDEO = "VIDEO"

class PostMedia(BaseModel):
    mediaType: MediaType
    mediaUrl: str
    postId: str

class PostMediaResponse(PostMedia):
    id: str
