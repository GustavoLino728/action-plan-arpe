from fastapi import APIRouter, status

from app.dependencies import DBSession, CurrentUser
from app.domain.strategic_perspective import models, schemas

router = APIRouter(prefix="/api/v1/strategic-perspectives", tags=["ARPE - Mapa Estratégico"])


@router.post("/", response_model=schemas.StrategicPerspectiveRead, status_code=status.HTTP_201_CREATED)
async def create_strategic_perspective(payload: schemas.StrategicPerspectiveCreate, db: DBSession, current_user: CurrentUser):
    perspective = models.StrategicPerspective(**payload.model_dump())
    db.add(perspective)
    await db.commit()
    await db.refresh(perspective)
    return perspective