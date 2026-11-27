from datetime import date
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Query

from app.dependencies import DBSession, CurrentUser
from app.domain.dashboard import schemas, services

router = APIRouter(prefix="/api/v1/dashboard", tags=["ARPE - Dashboard"])


@router.get("/overview", response_model=schemas.DashboardOverview)
async def overview(
    department_id: UUID | None = Query(None, description="Filtro por departamento"),
    farol: Literal["amarelo", "vermelho"] | None = Query(
        None, description="Filtra a tabela por farol específico",
    ),
    db: DBSession = ...,
    current_user: CurrentUser = ...,
):
    farol_filter = {farol} if farol else None
    return await services.get_overview(
        db,
        current_user=current_user,
        today=date.today(),
        department_id=department_id,
        farol_filter=farol_filter,
    )