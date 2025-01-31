from motor.motor_asyncio import AsyncIOMotorClient
from decouple import config

MONGO_URI = config("MONGO_URI")
DB_NAME = config("DATABASE_NAME")

client = AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]

comments_collection = db["comments"]
comment_reaction_collection = db["comment_reactions"]
