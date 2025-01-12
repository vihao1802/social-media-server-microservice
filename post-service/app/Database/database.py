from pymongo import MongoClient
from decouple import config

MONGO_URI = config("MONGO_URI")
DB_NAME = config("DATABASE_NAME")

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
post_collection = db["posts"]
postMedia_collection = db["post_media"]
postViewer_collection = db["post_viewers"]
