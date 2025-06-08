from typing import Any
from pydantic import BaseModel, model_validator, ValidationError

class Moderation(BaseModel):
    content: str = None
    file_data: Any = None
    file_content_type: str = None

    @model_validator(mode="after")
    def check_exclusive_fields(self):
        if self.content and not self.file_data and not self.file_content_type:
            return self

        if not self.content and self.file_data and self.file_content_type:
            return self

        raise ValueError(
            "You must provide either `content`, or both `file_data` and `file_content_type`, but not both."
        )