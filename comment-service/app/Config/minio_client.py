from minio import Minio
from dotenv import load_dotenv
from pathlib import Path
import os

env_path = Path('..') / '.env.global'
load_dotenv(dotenv_path=env_path)

minio_client = Minio(
    endpoint=os.getenv("MINIO_URL").split("//")[1],
    access_key=os.getenv("MINIO_ACCESS_KEY"),
    secret_key=os.getenv("MINIO_SECRET_KEY"),
    secure=False
)

service_preflex = "comment-service"

# Tạo bucket nếu chưa tồn tại
bucket_name = os.getenv("MINIO_BUCKET_NAME")
if not minio_client.bucket_exists(bucket_name):
    minio_client.make_bucket(bucket_name)