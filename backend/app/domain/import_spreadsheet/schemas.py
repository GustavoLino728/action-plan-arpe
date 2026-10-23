from datetime import date
from typing import Any, Literal

from pydantic import BaseModel

# Chaves em inglês — casam 1:1 com o que o frontend envia
REQUIRED_FIELDS = [
    "perspective", "objective", "responsible_sector", "initiative_name",
    "responsible_manager", "summary",
    "kr_code", "kr_name", "kr_goal",
    "sequential_number", "step_name",
    "planned_start_date", "planned_end_date",
    "responsible", "status",
]


class ImportPreviewRequest(BaseModel):
    grid: list[list[Any]]
    mapping: dict[str, int]


class ImportIssue(BaseModel):
    line: int
    field: str | None = None
    message: str


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


class ImportPreviewResponse(BaseModel):
    valid_rows: list[ValidatedRow]
    issues: list[ImportIssue]
    summary: dict[str, int]


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