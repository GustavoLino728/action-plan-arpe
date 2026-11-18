from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class StepCommentCreate(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)


class StepCommentRead(BaseModel):
    id: UUID
    step_id: UUID
    user_id: UUID | None = None
    user_name: str | None = None
    message: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)