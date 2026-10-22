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


class StrategicInitiativeRead(StrategicInitiativeBase):
    id: UUID
    strategic_objective_id: UUID
    model_config = ConfigDict(from_attributes=True)