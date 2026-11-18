from fastapi import APIRouter
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.domain.departments.permissions import can_see_all_initiatives
from app.dependencies import DBSession, CurrentUser
from app.domain.strategic_perspective.models import StrategicPerspective
from app.domain.strategic_objective.models import StrategicObjective
from app.domain.strategic_initiative.models import StrategicInitiative
from app.domain.key_result.models import KeyResult
from app.domain.action_plan_step.models import ActionPlanStep

router = APIRouter(prefix="/api/v1/strategic-map", tags=["ARPE - Mapa Estratégico"])

@router.get("/tree")
async def get_strategic_map_tree(db: DBSession, current_user: CurrentUser):
    stmt = (
        select(StrategicPerspective)
        .options(
            selectinload(StrategicPerspective.strategic_objectives)
            .selectinload(StrategicObjective.initiatives)
            .selectinload(StrategicInitiative.key_results)
            .selectinload(KeyResult.steps)
            .selectinload(ActionPlanStep.delay_justifications)
        )
    )
    result = await db.execute(stmt)
    perspectives = list(result.scalars().all())

    if not can_see_all_initiatives(current_user):
        user_dept = current_user.department_id
        for p in perspectives:
            for o in p.strategic_objectives:
                o.initiatives = [
                    i for i in o.initiatives if i.department_id == user_dept
                ]

    return perspectives