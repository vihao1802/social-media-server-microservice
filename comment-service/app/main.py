from fastapi import FastAPI, Depends
from fastapi_pagination import add_pagination
from app.Routes.Comment import comment_router
from app.Routes.CommentReaction import comment_reaction_router
from app.Services.auth_service import verify_token

app = FastAPI(
    title="Comment Service",
    description="This is a microservice social media network for commenting",
    version="1.0.0",
    dependencies=[Depends(verify_token)],
)

app.include_router(comment_router)
app.include_router(comment_reaction_router)

add_pagination(app)
