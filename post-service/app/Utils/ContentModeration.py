from fastapi import HTTPException
import json

from openai import moderations

from app.Config.google_genai import client, moderation_prompt, model_name
from google.genai import types
from app.Models.Moderation import Moderation
import re
from starlette.datastructures import UploadFile

async def content_moderation(moderation: Moderation):
    try:
        contents = (
            moderation.content if moderation.content is not None
            else types.Part.from_bytes(
                data=moderation.file_data,
                mime_type=moderation.file_content_type
            ) if moderation.file_data is not None and moderation.file_content_type is not None
            else None
        )

        if contents is None:
            raise HTTPException(status_code=400, detail="Invalid content or file type provided")

        response = client.models.generate_content(
            model=model_name,
            config=types.GenerateContentConfig(
                system_instruction=moderation_prompt),
            contents=contents,
        )

        if not response.text:
            raise HTTPException(status_code=500, detail="An unexpected error in checking content moderation")

        # Clean the response text to remove code block formatting
        clean_content = re.sub(r'```json|```', '', response.text).strip()

        result = json.loads(clean_content)

        flagged_categories = [key for key,value in result["categories"].items() if value]

        if bool(result.get("flagged",False)) and flagged_categories:
            raise HTTPException(status_code=400, detail=f"Your content has been flagged for the following categories: {flagged_categories}")

        return False

    except HTTPException as http_e:
        raise http_e

    except Exception as e:
        error_detail = str(e) if str(e) else "An unexpected error occurred"
        raise HTTPException(status_code=500, detail=error_detail)
