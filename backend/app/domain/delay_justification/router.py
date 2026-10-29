from uuid import UUID

from fastapi import APIRouter, status

from app.dependencies import CurrentUser, DBSession
from app.domain.delay_justification import schemas, services

router = APIRouter(
    prefix="/api/v1/delay-justifications",
    tags=["ARPE - Mapa Estratégico"],
)


@router.post(
    "/",
    response_model=schemas.DelayJustificationRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_delay_justification(
    payload: schemas.DelayJustificationCreate,
    db: DBSession,
    current_user: CurrentUser,
):
    justification = await services.create_justification(db, payload)
    await db.commit()
    return justification


@router.get(
    "/by-step/{step_id}",
    response_model=list[schemas.DelayJustificationRead],
)
async def list_justifications_by_step(
    step_id: UUID,
    db: DBSession,
    current_user: CurrentUser,
):
    return await services.list_justifications_by_step(db, step_id)


@router.patch(
    "/{justification_id}",
    response_model=schemas.DelayJustificationRead,
)
async def update_delay_justification(
    justification_id: UUID,
    payload: schemas.DelayJustificationUpdate,
    db: DBSession,
    current_user: CurrentUser,
):
    justification = await services.update_justification(db, justification_id, payload)
    await db.commit()
    return justification


@router.delete(
    "/{justification_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_delay_justification(
    justification_id: UUID,
    db: DBSession,
    current_user: CurrentUser,
):
    await services.delete_justification(db, justification_id)
    await db.commit()