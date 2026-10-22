from uuid import UUID

from pydantic import BaseModel, ConfigDict


class StrategicPerspectiveBase(BaseModel):
    name: str


class StrategicPerspectiveCreate(StrategicPerspectiveBase):
    pass


class StrategicPerspectiveRead(StrategicPerspectiveBase):
    id: UUID
    model_config = ConfigDict(from_attributes=True)