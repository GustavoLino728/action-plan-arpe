from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class StrategicInitiativeBase(BaseModel):
    responsible_sector: str
    name: str
    responsible_manager: str
    summary: str
    total_estimated_value: Optional[str] = None
    current_year_estimated_value: Optional[str] = None


class StrategicInitiativeCreate(StrategicInitiativeBase):
    strategic_objective_id: UUID


class StrategicInitiativeUpdate(BaseModel):
    responsible_sector: str | None = None
    name: str | None = None
    responsible_manager: str | None = None
    summary: str | None = None
    total_estimated_value: str | None = None
    current_year_estimated_value: str | None = None


class StrategicInitiativeRead(StrategicInitiativeBase):
    id: UUID
    strategic_objective_id: UUID
    model_config = ConfigDict(from_attributes=True)