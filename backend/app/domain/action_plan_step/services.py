from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.key_result.models import KeyResult
from app.domain.action_plan_step.models import ActionPlanStep, StepStatus

from app.core.exceptions import NotFoundError
from app.domain.action_plan_step import models, schemas


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

async def update_step(
    db: AsyncSession,
    step_id: UUID,
    payload: schemas.ActionPlanStepUpdate,
) -> models.ActionPlanStep:
    step = await db.get(models.ActionPlanStep, step_id)
    if not step:
        raise NotFoundError("Etapa não encontrada")

    data = payload.model_dump(exclude_unset=True)
    status_changed = "status" in data and data["status"] != step.status

    for field, value in data.items():
        setattr(step, field, value)

    await db.flush()

    if status_changed and step.status == models.StepStatus.COMPLETED:
        await recalculate_kr_progress(db, step.key_result_id)

    await db.refresh(step)
    return step


async def delete_step(db: AsyncSession, step_id: UUID) -> None:
    step = await db.get(models.ActionPlanStep, step_id)
    if not step:
        raise NotFoundError("Etapa não encontrada")
    await db.delete(step)
    await db.flush()