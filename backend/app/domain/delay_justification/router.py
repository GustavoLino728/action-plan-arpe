from fastapi import APIRouter, status

from app.dependencies import DBSession, CurrentUser
from app.domain.delay_justification import models, schemas
from app.domain.action_plan_step.models import ActionPlanStep, StepStatus
from app.core.exceptions import NotFoundError

router = APIRouter(prefix="/api/v1/delay-justifications", tags=["ARPE - Mapa Estratégico"])


@router.post("/", response_model=schemas.DelayJustificationRead, status_code=status.HTTP_201_CREATED)
async def create_delay_justification(payload: schemas.DelayJustificationCreate, db: DBSession, current_user: CurrentUser):
    step = await db.get(ActionPlanStep, payload.step_id)
    if not step:
        raise NotFoundError("Step not found")
    
    if step.status != StepStatus.DELAYED:
        step.status = StepStatus.DELAYED

    delay_justification = models.DelayJustification(**payload.model_dump())
    db.add(delay_justification)
    await db.commit()
    await db.refresh(delay_justification)
    return delay_justification