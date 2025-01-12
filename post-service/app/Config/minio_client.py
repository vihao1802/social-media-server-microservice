from minio import Minio
from dotenv import load_dotenv
import os

load_dotenv()

minio_client = Minio(
    endpoint=os.getenv("MINIO_ENDPOINT"),
    access_key=os.getenv("MINIO_ROOT_USER"),
    secret_key=os.getenv("MINIO_ROOT_PASSWORD"),
    secure=False
)

# Tạo bucket nếu chưa tồn tại
bucket_name = os.getenv("MINIO_BUCKET_NAME")
if not minio_client.bucket_exists(bucket_name):
    minio_client.make_bucket(bucket_name)