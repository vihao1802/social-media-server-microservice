from fastapi import FastAPI, Depends
from fastapi_pagination import add_pagination
from starlette.middleware import Middleware

from app.Config.kafka_producer import kafka_producer
from app.Middlewares.auth_middleware import AuthMiddleware
from app.Routes.Comment import comment_router
from app.Routes.CommentReaction import comment_reaction_router
from app.Services.auth_service import verify_token

app = FastAPI(
    title="Comment Service",
    description="This is a microservice social media network for commenting",
    version="1.0.0",
    # dependencies=[Depends(verify_token)],
    middleware=[Middleware(AuthMiddleware)]
)

app.include_router(comment_router)
app.include_router(comment_reaction_router)

add_pagination(app)

@app.on_event("startup")
async def startup():
    await kafka_producer.start()

@app.on_event("shutdown")
async def shutdown():
    await kafka_producer.stop()
