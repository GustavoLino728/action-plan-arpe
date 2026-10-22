from fastapi import APIRouter, status

from app.dependencies import DBSession, CurrentUser
from app.domain.strategic_objective import models, schemas
from app.domain.strategic_perspective.models import StrategicPerspective
from app.core.exceptions import NotFoundError

router = APIRouter(prefix="/api/v1/strategic-objectives", tags=["ARPE - Mapa Estratégico"])


@router.post("/", response_model=schemas.StrategicObjectiveRead, status_code=status.HTTP_201_CREATED)
async def create_strategic_objective(payload: schemas.StrategicObjectiveCreate, db: DBSession, current_user: CurrentUser):
    perspective = await db.get(StrategicPerspective, payload.strategic_perspective_id)
    if not perspective:
        raise NotFoundError("Strategic Perspective not found")
        
    objective = models.StrategicObjective(**payload.model_dump())
    db.add(objective)
    await db.commit()
    await db.refresh(objective)
    return objective