from fastapi import HTTPException
import json
from app.Config.openrouter_client import openai_client, moderation_prompt, model_name
from app.Models.Comment import CommentModeration, TypeModeration
import re

def content_moderation(comment_moderation: list[CommentModeration]):
    try:
        input_list = [{
                          "type": "text",
                          "text": comment.content
                      } if comment.type == TypeModeration.TEXT else
                      {
                          "type": "image_url",
                          "image_url": {
                              "url": comment.content,
                          }
                      } for comment in comment_moderation]

        completion = openai_client.chat.completions.create(
            model=model_name,
            messages=[
                {
                    "role": "system",
                    "content": moderation_prompt
                },
                {
                    "role": "user",
                    "content": input_list
                }
            ]
        )

        if not completion.choices:
            raise HTTPException(status_code=500, detail="An unexpected error in checking content moderation")

        clean_content = re.sub(r'```json|```', '', completion.choices[0].message.content).strip()

        result = json.loads(clean_content)

        print(result)

        flagged_categories = [key for key,value in result["categories"].items() if value]

        if bool(result.get("flagged",False)) and flagged_categories:
            raise HTTPException(status_code=400, detail=f"Your content has been flagged for the following categories: {flagged_categories}")

        return False

    except HTTPException as http_e:
        raise http_e

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))