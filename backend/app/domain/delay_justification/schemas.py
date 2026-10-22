from datetime import date
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class DelayJustificationBase(BaseModel):
    registration_date: date
    corrective_action: str
    responsible: str
    solution_forecast: date
    under_arpe_governance: bool
    resolved: bool = False


class DelayJustificationCreate(DelayJustificationBase):
    step_id: UUID


class DelayJustificationRead(DelayJustificationBase):
    id: UUID
    step_id: UUID
    model_config = ConfigDict(from_attributes=True)