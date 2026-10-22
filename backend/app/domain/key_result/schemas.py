from uuid import UUID

from pydantic import BaseModel, ConfigDict


class KeyResultBase(BaseModel):
    code: str
    name: str
    goal: str


class KeyResultCreate(KeyResultBase):
    initiative_id: UUID


class KeyResultRead(KeyResultBase):
    id: UUID
    initiative_id: UUID
    percentage_progress: float
    model_config = ConfigDict(from_attributes=True)