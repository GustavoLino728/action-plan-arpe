from datetime import date
from typing import Any, Literal

from pydantic import BaseModel


class ImportPreviewResponse(BaseModel):
    valid_rows: list["ValidatedRow"]
    issues: list["ImportIssue"]
    summary: dict[str, Any]


class ImportIssue(BaseModel):
    line: int
    field: str | None = None
    message: str


class JustificativaData(BaseModel):
    problema: str
    data_registro: date | None = None
    acao_corretiva: str = ""
    responsavel: str = ""
    previsao_solucao: date | None = None
    sob_governanca_arpe: bool = False
    resolvido: bool = False


class ValidatedRow(BaseModel):
    perspective: str
    objective: str
    responsible_sector: str
    initiative_name: str
    responsible_manager: str
    summary: str
    total_estimated_value: str | None = None
    current_year_estimated_value: str | None = None
    kr_code: str
    kr_name: str
    kr_goal: str
    sequential_number: int
    step_name: str
    planned_start_date: date
    planned_end_date: date
    actual_start_date: date | None = None
    actual_end_date: date | None = None
    responsible: str
    status: str
    justificativas: list[JustificativaData] = []


class ImportCommitRequest(BaseModel):
    rows: list[ValidatedRow]
    mode: Literal["append", "replace"] = "append"


class ImportCommitResponse(BaseModel):
    strategic_perspectives_created: int
    strategic_objectives_created: int
    initiatives_created: int
    key_results_created: int
    steps_upserted: int
    steps_deleted: int
    justificativas_upserted: int