from datetime import date
from typing import Any, Literal

from pydantic import BaseModel, Field

# Definição dos campos esperados — fonte da verdade pro front também
FIELD_KEYS = Literal[
    "strategic_perspective", "strategic_objective",
    "setor_responsavel", "nome_iniciativa", "gestor_responsavel",
    "descricao_resumida", "valor_estimado_total", "valor_estimado_ano_vigente",
    "codigo_kr", "nome_kr", "meta_kr",
    "numero_sequencial", "nome_etapa",
    "data_inicio_previsto", "data_termino_previsto",
    "data_inicio_realizado", "data_termino_realizado",
    "responsavel_etapa", "status",
]

REQUIRED_FIELDS = [
    "strategic_perspective", "strategic_objective", "setor_responsavel", "nome_iniciativa",
    "gestor_responsavel", "descricao_resumida",
    "codigo_kr", "nome_kr", "meta_kr",
    "numero_sequencial", "nome_etapa",
    "data_inicio_previsto", "data_termino_previsto",
    "responsavel_etapa", "status",
]


class ImportPreviewRequest(BaseModel):
    grid: list[list[Any]]
    mapping: dict[str, int]  # FIELD_KEY -> índice da coluna no grid


class ImportIssue(BaseModel):
    line: int  # número da linha no arquivo original (1-based no header, 2+ nos dados)
    field: str | None = None
    message: str


class ValidatedRow(BaseModel):
    strategic_perspective: str
    strategic_objective: str
    setor_responsavel: str
    nome_iniciativa: str
    gestor_responsavel: str
    descricao_resumida: str
    valor_estimado_total: str | None = None
    valor_estimado_ano_vigente: str | None = None
    codigo_kr: str
    nome_kr: str
    meta_kr: str
    numero_sequencial: int
    nome_etapa: str
    data_inicio_previsto: date
    data_termino_previsto: date
    data_inicio_realizado: date | None = None
    data_termino_realizado: date | None = None
    responsavel_etapa: str
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
    iniciativas_created: int
    key_results_created: int
    etapas_upserted: int
    etapas_deleted: int  # só em mode=replace