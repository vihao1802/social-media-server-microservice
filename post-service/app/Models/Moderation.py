from pydantic import BaseModel
from enum import Enum

class TypeModeration(Enum):
    TEXT = "text"
    IMAGE_URL = "image_url"

class Moderation(BaseModel):
    content: str
    type: TypeModeration