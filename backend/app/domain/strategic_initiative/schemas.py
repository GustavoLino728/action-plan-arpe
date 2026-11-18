from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.domain.departments.schemas import DepartmentRead


class StrategicInitiativeBase(BaseModel):
    name: str
    responsible_manager: str
    summary: str
    total_estimated_value: Optional[str] = None
    current_year_estimated_value: Optional[str] = None
    department_id: UUID | None = None


class StrategicInitiativeCreate(StrategicInitiativeBase):
    strategic_objective_id: UUID


class StrategicInitiativeUpdate(BaseModel):
    name: str | None = None
    responsible_manager: str | None = None
    summary: str | None = None
    total_estimated_value: str | None = None
    current_year_estimated_value: str | None = None
    department_id: UUID | None = None


class StrategicInitiativeRead(StrategicInitiativeBase):
    id: UUID
    strategic_objective_id: UUID
    department: DepartmentRead | None = None
    model_config = ConfigDict(from_attributes=True)