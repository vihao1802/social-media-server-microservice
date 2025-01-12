from pydantic import BaseModel


class PostViewer(BaseModel):
    userId: str
    liked: bool
    postId: str


class PostViewerRequest(PostViewer):
    pass


class PostViewerResponse(PostViewer):
    id: str
