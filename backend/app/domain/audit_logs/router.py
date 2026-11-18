from uuid import UUID

from fastapi import APIRouter, status

from app.dependencies import CurrentUser, DBSession
from app.domain.audit_logs import schemas, services

router = APIRouter(prefix="/api/v1/audit-logs", tags=["ARPE - Auditoria"])


@router.get("/", response_model=list[schemas.AuditLogRead])
async def list_audit_logs(
    entity_type: str,
    entity_id: UUID,
    limit: int = 100,
    db: DBSession = ...,
    current_user: CurrentUser = ...,
):
    return await services.list_for_entity(
        db, entity_type=entity_type, entity_id=entity_id, limit=limit
    )