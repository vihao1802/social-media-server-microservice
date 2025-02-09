from fastapi import HTTPException

from openai import OpenAI
from dotenv import load_dotenv
import os

load_dotenv()

if not os.getenv("BASE_URL") or not os.getenv("API_KEY") or not os.getenv("MODEL_NAME") or not os.getenv("MODERATION_PROMPT"):
    raise HTTPException(status_code=500, detail="Missing environment variables")

openai_client = OpenAI(
    base_url=os.getenv("BASE_URL"),
    api_key=os.getenv("API_KEY"),
)

model_name = os.getenv("MODEL_NAME")
moderation_prompt = os.getenv("MODERATION_PROMPT")
