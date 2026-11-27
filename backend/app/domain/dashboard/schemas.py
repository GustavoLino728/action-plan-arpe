from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


Farol = Literal["verde", "amarelo", "vermelho"]


class DashboardCards(BaseModel):
    total_krs: int
    verde: int
    amarelo: int
    vermelho: int
    sem_prazo: int
    krs_sem_movimento: int
    steps_atrasadas: int


class KrAlert(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    code: str
    name: str

    initiative_id: UUID | None

    initiative_name: str
    department_id: UUID | None
    department_name: str | None
    percentage_progress: int
    expected_progress: int
    deviation_pp: int
    days_to_deadline: int
    farol: Farol
    

class DashboardOverview(BaseModel):
    cards: DashboardCards
    krs_alerta: list[KrAlert]
    scope: Literal["global", "department"]