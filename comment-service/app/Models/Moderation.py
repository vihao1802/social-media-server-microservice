from pydantic import BaseModel
from fastapi import UploadFile

class Moderation(BaseModel):
    content: str | UploadFile