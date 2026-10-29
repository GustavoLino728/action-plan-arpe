from fastapi import APIRouter, status
from uuid import UUID

from app.dependencies import DBSession, CurrentUser
from app.domain.strategic_initiative import models, schemas, services
from app.domain.strategic_objective.models import StrategicObjective
from app.core.exceptions import NotFoundError

router = APIRouter(prefix="/api/v1/initiatives", tags=["ARPE - Mapa Estratégico"])


@router.post("/", response_model=schemas.StrategicInitiativeRead, status_code=status.HTTP_201_CREATED)
async def create_initiative(payload: schemas.StrategicInitiativeCreate, db: DBSession, current_user: CurrentUser):
    objective = await db.get(StrategicObjective, payload.strategic_objective_id)
    if not objective:
        raise NotFoundError("Strategic Objective not found")

    initiative = models.StrategicInitiative(**payload.model_dump())
    db.add(initiative)
    await db.commit()
    await db.refresh(initiative)
    return initiative

@router.patch(
    "/{initiative_id}",
    response_model=schemas.StrategicInitiativeRead,
)
async def update_initiative(
    initiative_id: UUID,
    payload: schemas.StrategicInitiativeUpdate,
    db: DBSession,
    current_user: CurrentUser,
):
    initiative = await services.update_initiative(db, initiative_id, payload)
    await db.commit()
    return initiative


@router.delete("/{initiative_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_initiative(
    initiative_id: UUID,
    db: DBSession,
    current_user: CurrentUser,
):
    await services.delete_initiative(db, initiative_id)
    await db.commit()