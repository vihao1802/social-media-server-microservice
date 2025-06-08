from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, status, HTTPException, Form, UploadFile, File
from fastapi_pagination import response

from app.Database.database import postMedia_collection, post_collection
from app.Models.Moderation import Moderation
from app.Models.PostMedia import PostMediaResponse, MediaType
from app.Config.minio_client import service_preflex, minio_client, bucket_name
from minio.error import InvalidResponseError
import base64

from app.Utils.ContentModeration import content_moderation

postMedia_router = APIRouter(prefix="/post_media", tags=["PostMedia"])

@postMedia_router.get("/{post_id}", status_code=status.HTTP_200_OK)
async def get(post_id: str):
    try:
        media = await postMedia_collection.find({"postId": post_id}).to_list()
        return [PostMediaResponse(**m, id=str(m["_id"])) for m in media]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")



# @postMedia_router.post("", status_code=status.HTTP_201_CREATED,
#                        # response_model=PostMediaResponse
#                        )
# async def create(
#         media_type: MediaType = Form(...),
#         media_file: UploadFile = File(...),
#         post_id: Optional[str] = Form(None)
# ):
#     try:
#         # post = await post_collection.find_one({"_id": ObjectId(post_id)})
#         #
#         # if not post:
#         #     raise HTTPException(status_code=404, detail="Post not found")
#
#         if not media_file:
#             raise HTTPException(status_code=400, detail="Media file is required")
#
#         if not await content_moderation(Moderation(content=media_file)):
#             # Save media file to Minio
#             media_url = f"{service_preflex}/{media_file.filename}"
#
#             minio_client.put_object(bucket_name, media_url, media_file.file, -1,media_file.content_type, part_size=10*1024*1024)
#
#             new_post_media = {
#                 "mediaType": media_type.value,
#                 "postId": post_id,
#                 "mediaUrl": f"{bucket_name}/{media_url}"
#             }
#
#             result = await postMedia_collection.insert_one(new_post_media)
#
#             return PostMediaResponse(**new_post_media, id=str(result.inserted_id))
#     except HTTPException as http_e:
#         raise http_e
#
#     except InvalidResponseError as e:
#         raise HTTPException(status_code=500 ,detail=f"MinIO error: {str(e)}")
#
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")
