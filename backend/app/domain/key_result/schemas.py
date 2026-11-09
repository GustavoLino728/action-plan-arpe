from datetime import date
from uuid import UUID

from pydantic import BaseModel, ConfigDict
from app.domain.action_plan_step.models import StepStatus


class KeyResultBase(BaseModel):
    code: str
    name: str
    goal: str


class KeyResultCreate(KeyResultBase):
    initiative_id: UUID
    planned_start_date: date | None = None
    planned_end_date: date | None = None
    actual_start_date: date | None = None
    actual_end_date: date | None = None
    responsible: str | None = None
    status: StepStatus | None = None


class KeyResultUpdate(BaseModel):
    code: str | None = None
    name: str | None = None
    goal: str | None = None
    planned_start_date: date | None = None
    planned_end_date: date | None = None
    actual_start_date: date | None = None
    actual_end_date: date | None = None
    responsible: str | None = None
    status: StepStatus | None = None


class KeyResultRead(KeyResultBase):
    id: UUID
    initiative_id: UUID
    percentage_progress: float
    planned_start_date: date | None = None
    planned_end_date: date | None = None
    actual_start_date: date | None = None
    actual_end_date: date | None = None
    responsible: str | None = None
    status: StepStatus | None = None
    model_config = ConfigDict(from_attributes=True)