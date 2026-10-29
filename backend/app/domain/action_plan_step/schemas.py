from datetime import date
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.domain.action_plan_step.models import StepStatus


class ActionPlanStepBase(BaseModel):
    sequential_number: int
    name: str
    planned_start_date: date
    planned_end_date: date
    actual_start_date: Optional[date] = None
    actual_end_date: Optional[date] = None
    responsible: str
    status: StepStatus = StepStatus.NOT_STARTED


class ActionPlanStepCreate(ActionPlanStepBase):
    key_result_id: UUID

class ActionPlanStepUpdate(BaseModel):
    sequential_number: int | None = None
    name: str | None = None
    planned_start_date: date | None = None
    planned_end_date: date | None = None
    actual_start_date: date | None = None
    actual_end_date: date | None = None
    responsible: str | None = None
    status: StepStatus | None = None

class ActionPlanStepUpdateStatus(BaseModel):
    status: StepStatus
    actual_start_date: Optional[date] = None
    actual_end_date: Optional[date] = None


class ActionPlanStepRead(ActionPlanStepBase):
    id: UUID
    key_result_id: UUID
    model_config = ConfigDict(from_attributes=True)