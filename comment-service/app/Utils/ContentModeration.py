from fastapi import HTTPException
from app.Config.openai_client import openai_client
from app.Models.Comment import CommentModeration, TypeModeration

def content_moderation(comment_moderations: list[CommentModeration]):
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
                      } for comment in comment_moderations]

        print(input_list)
        response = openai_client.moderations.create(
            model="omni-moderation-latest",
            input=input_list,
        )
        flagged = response["results"][0]["flagged"]
        if flagged:
            raise HTTPException(status_code=400, detail="Content is not allowed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error in checking content moderation: {str(e)}")