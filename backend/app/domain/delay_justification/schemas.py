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


class DelayJustificationUpdate(BaseModel):
    """Atualização parcial: qualquer campo omitido mantém o valor atual."""
    registration_date: date | None = None
    corrective_action: str | None = None
    responsible: str | None = None
    solution_forecast: date | None = None
    under_arpe_governance: bool | None = None
    resolved: bool | None = None


class DelayJustificationRead(DelayJustificationBase):
    id: UUID
    step_id: UUID
    model_config = ConfigDict(from_attributes=True)