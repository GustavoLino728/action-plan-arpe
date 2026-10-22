from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.key_result.models import KeyResult
from app.domain.action_plan_step.models import ActionPlanStep, StepStatus


async def recalculate_kr_progress(db: AsyncSession, kr_id: UUID) -> None:
    """Calculates the KR completion percentage based on completed steps."""
    stmt = select(ActionPlanStep).where(ActionPlanStep.key_result_id == kr_id)
    result = await db.execute(stmt)
    steps = result.scalars().all()
    
    if not steps:
        return
        
    total_steps = len(steps)
    completed_steps = sum(1 for step in steps if step.status == StepStatus.COMPLETED)
    
    percentage = (completed_steps / total_steps) * 100
    
    kr = await db.get(KeyResult, kr_id)
    if kr:
        kr.percentage_progress = round(percentage, 2)