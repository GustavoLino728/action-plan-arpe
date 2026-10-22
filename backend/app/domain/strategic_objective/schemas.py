from uuid import UUID

from pydantic import BaseModel, ConfigDict


class StrategicObjectiveBase(BaseModel):
    name: str


class StrategicObjectiveCreate(StrategicObjectiveBase):
    strategic_perspective_id: UUID


class StrategicObjectiveRead(StrategicObjectiveBase):
    id: UUID
    strategic_perspective_id: UUID
    model_config = ConfigDict(from_attributes=True)