from fastapi import APIRouter, status

from app.dependencies import DBSession, CurrentUser
from app.domain.strategic_initiative import models, schemas
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