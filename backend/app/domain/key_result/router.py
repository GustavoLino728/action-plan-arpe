from fastapi import APIRouter, status

from app.dependencies import DBSession, CurrentUser
from app.domain.key_result import models, schemas
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