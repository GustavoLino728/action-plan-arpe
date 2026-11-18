from datetime import date, datetime
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.key_result.models import KeyResult
from app.domain.action_plan_step.models import ActionPlanStep, StepStatus
from app.domain.users.models import User

from app.core.exceptions import NotFoundError
from app.domain.action_plan_step import models, schemas
from app.domain.audit_logs import services as audit_service


def _serialize(v: Any) -> Any:
    if isinstance(v, (date, datetime)):
        return v.isoformat()
    if hasattr(v, "value"):
        return v.value
    return v


async def recalculate_kr_progress(db: AsyncSession, kr_id: UUID) -> None:
    """Calculates the KR completion percentage based on completed steps."""
    stmt = select(ActionPlanStep).where(ActionPlanStep.key_result_id == kr_id)
    result = await db.execute(stmt)
    steps = result.scalars().all()
    
    if not steps:
        return
        
    total_steps = len(steps)
    completed_steps = sum(1 for step in steps if step.status == StepStatus.COMPLETED)
    
    percentage = (completed_steps / total_steps) * 100
    
    kr = await db.get(KeyResult, kr_id)
    if kr:
        kr.percentage_progress = round(percentage, 2)


async def create_step(
    db: AsyncSession,
    payload: schemas.ActionPlanStepUpdate,
    current_user: User,
)-> models.ActionPlanStep:
    kr = await db.get(KeyResult, payload.key_result_id)
    if not kr:
        raise NotFoundError("Key Result not found")

    step = models.ActionPlanStep(**payload.model_dump())
    db.add(step)
    await db.commit()
    await db.refresh(step)
    return step


async def update_step(
    db: AsyncSession,
    step_id: UUID,
    payload: schemas.ActionPlanStepUpdate,
    current_user: User,
) -> models.ActionPlanStep:
    step = await db.get(models.ActionPlanStep, step_id)
    if not step:
        raise NotFoundError("Etapa não encontrada")

    data = payload.model_dump(exclude_unset=True)
    changes: dict[str, dict[str, Any]] = {}
    for field, new_value in data.items():
        old_value = getattr(step, field)
        if old_value != new_value:
            changes[field] = {
                "old": _serialize(old_value),
                "new": _serialize(new_value),
            }

    if not changes:
        return step

    status_changed = "status" in changes

    for field, new_value in data.items():
        setattr(step, field, new_value)

    await db.flush()
    await audit_service.record(
        db,
        entity_type="step",
        entity_id=step.id,
        action="status_changed" if status_changed else "updated",
        current_user=current_user,
        changes=changes,
    )

    if status_changed and step.status == models.StepStatus.COMPLETED:
        await recalculate_kr_progress(db, step.key_result_id)

    await db.refresh(step)
    return step


async def delete_step(
    db: AsyncSession,
    step_id: UUID,
    current_user: User,
) -> None:
    step = await db.get(models.ActionPlanStep, step_id)
    if not step:
        raise NotFoundError("Etapa não encontrada")

    await audit_service.record(
        db,
        entity_type="step",
        entity_id=step.id,
        action="deleted",
        current_user=current_user,
        message=f"Etapa '{step.name}' excluída",
    )

    await db.delete(step)
    await db.flush()