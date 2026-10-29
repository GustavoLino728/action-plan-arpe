from fastapi import APIRouter, status

from uuid import UUID

from app.dependencies import DBSession, CurrentUser
from app.domain.key_result import models, schemas, services
from app.domain.strategic_initiative.models import StrategicInitiative
from app.core.exceptions import NotFoundError

router = APIRouter(prefix="/api/v1/key-results", tags=["ARPE - Mapa Estratégico"])


@router.post("/", response_model=schemas.KeyResultRead, status_code=status.HTTP_201_CREATED)
async def create_key_result(payload: schemas.KeyResultCreate, db: DBSession, current_user: CurrentUser):
    initiative = await db.get(StrategicInitiative, payload.initiative_id)
    if not initiative:
        raise NotFoundError("Strategic Initiative not found")

    kr = models.KeyResult(**payload.model_dump())
    db.add(kr)
    await db.commit()
    await db.refresh(kr)
    return kr

@router.patch(
    "/{kr_id}",
    response_model=schemas.KeyResultRead,
)
async def update_key_result(
    kr_id: UUID,
    payload: schemas.KeyResultUpdate,
    db: DBSession,
    current_user: CurrentUser,
):
    kr = await services.update_key_result(db, kr_id, payload)
    await db.commit()
    return kr


@router.delete("/{kr_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_key_result(
    kr_id: UUID,
    db: DBSession,
    current_user: CurrentUser,
):
    await services.delete_key_result(db, kr_id)
    await db.commit()