from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.domain.action_plan_step.models import ActionPlanStep, StepStatus
from app.domain.delay_justification import models, schemas


async def create_justification(
    db: AsyncSession,
    payload: schemas.DelayJustificationCreate,
) -> models.DelayJustification:
    step = await db.get(ActionPlanStep, payload.step_id)
    if not step:
        raise NotFoundError("Etapa não encontrada")

    if step.status != StepStatus.DELAYED:
        step.status = StepStatus.DELAYED

    justification = models.DelayJustification(**payload.model_dump())
    db.add(justification)
    await db.flush()
    await db.refresh(justification)
    return justification


async def update_justification(
    db: AsyncSession,
    justification_id: UUID,
    payload: schemas.DelayJustificationUpdate,
) -> models.DelayJustification:
    justification = await db.get(models.DelayJustification, justification_id)
    if not justification:
        raise NotFoundError("Justificativa não encontrada")

    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(justification, field, value)

    await db.flush()
    await db.refresh(justification)
    return justification


async def delete_justification(
    db: AsyncSession,
    justification_id: UUID,
) -> None:
    justification = await db.get(models.DelayJustification, justification_id)
    if not justification:
        raise NotFoundError("Justificativa não encontrada")

    await db.delete(justification)
    await db.flush()


async def get_justification_by_step(
    db: AsyncSession,
    step_id: UUID,
) -> models.DelayJustification | None:
    """Útil para checar se a etapa já tem justificativa (relação 1:1)."""
    result = await db.execute(
        select(models.DelayJustification).where(
            models.DelayJustification.step_id == step_id
        )
    )
    return result.scalar_one_or_none()