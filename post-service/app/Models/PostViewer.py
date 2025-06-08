from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class PostViewer(BaseModel):
    userId: str
    postId: str
    createdAt: Optional[datetime] = datetime.now()


class PostViewerRequest(PostViewer):
    pass


class PostViewerResponse(PostViewer):
    id: str
