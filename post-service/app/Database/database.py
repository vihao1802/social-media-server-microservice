from motor.motor_asyncio import AsyncIOMotorClient
from decouple import config

MONGO_URI = config("MONGO_URI")
DB_NAME = config("DATABASE_NAME")

client = AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]

post_collection = db["posts"]
postMedia_collection = db["post_media"]
postViewer_collection = db["post_viewers"]
