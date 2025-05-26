from google import genai
from fastapi import HTTPException
from dotenv import load_dotenv
import os

load_dotenv()

if not os.getenv("API_KEY") or not os.getenv("MODEL_NAME") or not os.getenv("MODERATION_PROMPT"):
    raise HTTPException(status_code=500, detail="Missing environment variables")

client = genai.Client(api_key=os.getenv("API_KEY"))

model_name = os.getenv("MODEL_NAME")
moderation_prompt = os.getenv("MODERATION_PROMPT")