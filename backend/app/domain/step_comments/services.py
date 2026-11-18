from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError, NotFoundError
from app.domain.action_plan_step.models import ActionPlanStep
from app.domain.step_comments import models, schemas
from app.domain.users.models import User


async def create_comment(
    db: AsyncSession,
    step_id: UUID,
    payload: schemas.StepCommentCreate,
    current_user: User,
) -> models.StepComment:
    step = await db.get(ActionPlanStep, step_id)
    if not step:
        raise NotFoundError("Etapa não encontrada")

    comment = models.StepComment(
        step_id=step_id,
        user_id=current_user.id,
        user_name=current_user.name,
        message=payload.message.strip(),
    )
    db.add(comment)
    await db.flush()
    await db.refresh(comment)
    return comment


async def list_for_step(
    db: AsyncSession,
    step_id: UUID,
) -> list[models.StepComment]:
    result = await db.execute(
        select(models.StepComment)
        .where(models.StepComment.step_id == step_id)
        .order_by(models.StepComment.created_at.desc())
    )
    return list(result.scalars().all())


async def delete_comment(
    db: AsyncSession,
    comment_id: UUID,
    current_user: User,
) -> None:
    comment = await db.get(models.StepComment, comment_id)
    if not comment:
        raise NotFoundError("Comentário não encontrado")
    # Só o autor ou um admin podem excluir
    if comment.user_id != current_user.id and current_user.role != "admin":
        raise ForbiddenError("Sem permissão para excluir este comentário")
    await db.delete(comment)
    await db.flush()