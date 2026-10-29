from uuid import UUID

from fastapi import APIRouter, status

from app.dependencies import DBSession, CurrentUser
from app.domain.action_plan_step import models, schemas, services
from app.domain.key_result.models import KeyResult
from app.core.exceptions import NotFoundError

router = APIRouter(prefix="/api/v1/steps", tags=["ARPE - Mapa Estratégico"])


@router.post("/", response_model=schemas.ActionPlanStepRead, status_code=status.HTTP_201_CREATED)
async def create_step(payload: schemas.ActionPlanStepCreate, db: DBSession, current_user: CurrentUser):
    kr = await db.get(KeyResult, payload.key_result_id)
    if not kr:
        raise NotFoundError("Key Result not found")

    step = models.ActionPlanStep(**payload.model_dump())
    db.add(step)
    await db.commit()
    await db.refresh(step)
    return step


@router.patch("/{step_id}/status", response_model=schemas.ActionPlanStepRead)
async def update_step_status(
    step_id: UUID,
    payload: schemas.ActionPlanStepUpdateStatus,
    db: DBSession,
    current_user: CurrentUser,
):
    step = await db.get(models.ActionPlanStep, step_id)
    if not step:
        raise NotFoundError("Step not found")

    step.status = payload.status
    if payload.actual_start_date:
        step.actual_start_date = payload.actual_start_date
    if payload.actual_end_date:
        step.actual_end_date = payload.actual_end_date

    if payload.status == models.StepStatus.COMPLETED:
        await services.recalculate_kr_progress(db, step.key_result_id)

    await db.commit()
    await db.refresh(step)
    return step

@router.patch(
    "/{step_id}",
    response_model=schemas.ActionPlanStepRead,
)
async def update_step(
    step_id: UUID,
    payload: schemas.ActionPlanStepUpdate,
    db: DBSession,
    current_user: CurrentUser,
):
    step = await services.update_step(db, step_id, payload)
    await db.commit()
    return step


@router.delete("/{step_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_step(
    step_id: UUID,
    db: DBSession,
    current_user: CurrentUser,
):
    await services.delete_step(db, step_id)
    await db.commit()