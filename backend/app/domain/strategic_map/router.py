from fastapi import APIRouter
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.dependencies import DBSession, CurrentUser
from app.domain.strategic_perspective.models import StrategicPerspective
from app.domain.strategic_objective.models import StrategicObjective
from app.domain.strategic_initiative.models import StrategicInitiative
from app.domain.key_result.models import KeyResult
from app.domain.action_plan_step.models import ActionPlanStep

router = APIRouter(prefix="/api/v1/strategic-map", tags=["ARPE - Mapa Estratégico"])

@router.get("/tree")
async def get_strategic_map_tree(db: DBSession, current_user: CurrentUser):
    """
    Retorna toda a árvore hierárquica do mapa estratégico
    (StrategicPerspective -> strategic_objective -> Iniciativa -> KR -> Etapa -> Justificativa).
    """
    stmt = (
        select(StrategicPerspective)
        .options(
            selectinload(StrategicPerspective.strategic_objectives)
            .selectinload(StrategicObjective.iniciativas)
            .selectinload(StrategicInitiative.key_results)
            .selectinload(KeyResult.etapas)
            .selectinload(ActionPlanStep.justificativa)
        )
    )
    result = await db.execute(stmt)
    return result.scalars().all()