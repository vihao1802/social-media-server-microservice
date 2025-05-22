from fastapi import FastAPI, Depends

from app.Config.kafka_producer import kafka_producer
from app.Routes.Post import post_router
from app.Routes.PostMedia import postMedia_router
from app.Routes.PostViewer import postViewer_router
from fastapi_pagination import add_pagination

from app.Services.auth_service import verify_token

app = FastAPI(
    title="Post Service",
    description="This is a microservice social media network for posting",
    version="1.0.0",
    dependencies=[Depends(verify_token)],
)

# Register routes
app.include_router(post_router)
app.include_router(postViewer_router)
app.include_router(postMedia_router)

# Add pagination
add_pagination(app)

@app.on_event("startup")
async def startup():
    await kafka_producer.start()

@app.on_event("shutdown")
async def shutdown():
    await kafka_producer.stop()

