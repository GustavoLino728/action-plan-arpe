from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.audit_logs import models
from app.domain.users.models import User


async def record(
    db: AsyncSession,
    *,
    entity_type: str,
    entity_id: UUID,
    action: str,
    current_user: User | None,
    changes: dict[str, Any] | None = None,
    message: str | None = None,
) -> models.AuditLog:
    """Registra uma entrada de auditoria DENTRO da transação em curso.
    Se quem chamou fizer rollback, o log também é descartado."""
    log = models.AuditLog(
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        user_id=current_user.id if current_user else None,
        user_name=current_user.name if current_user else "Sistema",
        changes=changes,
        message=message,
    )
    db.add(log)
    await db.flush()
    return log


async def list_for_entity(
    db: AsyncSession,
    *,
    entity_type: str,
    entity_id: UUID,
    limit: int = 100,
) -> list[models.AuditLog]:
    result = await db.execute(
        select(models.AuditLog)
        .where(
            models.AuditLog.entity_type == entity_type,
            models.AuditLog.entity_id == entity_id,
        )
        .order_by(models.AuditLog.created_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())