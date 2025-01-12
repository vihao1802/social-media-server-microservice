from fastapi import APIRouter, status, HTTPException, Form, UploadFile, File
from app.Database.database import postMedia_collection
from app.Models.PostMedia import PostMediaResponse, MediaType
from app.Config.minio_client import minio_client, bucket_name
from minio.error import InvalidResponseError

postMedia_router = APIRouter(prefix="/post_media", tags=["PostMedia"])

@postMedia_router.get("/{post_id}", status_code=status.HTTP_200_OK)
async def get(post_id: str):
    media = postMedia_collection.find({"postId": post_id})
    return media

@postMedia_router.post("/", status_code=status.HTTP_201_CREATED, response_model=PostMediaResponse)
async def create(
        media_type: MediaType = Form(...),
        media_file: UploadFile = File(...),
        post_id: str = Form(...)):
    try:
        media = media_file
        media_type = media_type
        media_url = f"{post_id}/{media.filename}"

        minio_client.put_object(bucket_name, media_url, media.file, -1,media.content_type, part_size=10*1024*1024)
        new_post_media = {
            "mediaType": media_type.value,
            "postId": post_id,
            "mediaUrl": media_url
        }
        result = postMedia_collection.insert_one(new_post_media)
        return PostMediaResponse(**new_post_media, id=str(result.inserted_id))
    except InvalidResponseError as e:
        raise HTTPException(status_code=500 ,detail=f"MinIO error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")
