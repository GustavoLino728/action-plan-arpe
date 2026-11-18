from uuid import UUID

from fastapi import APIRouter, status

from app.dependencies import CurrentUser, DBSession
from app.domain.step_comments import schemas, services

router = APIRouter(
    prefix="/api/v1/steps",
    tags=["ARPE - Comentários"],
)


@router.get(
    "/{step_id}/comments",
    response_model=list[schemas.StepCommentRead],
)
async def list_step_comments(
    step_id: UUID,
    db: DBSession,
    current_user: CurrentUser,
):
    return await services.list_for_step(db, step_id)


@router.post(
    "/{step_id}/comments",
    response_model=schemas.StepCommentRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_step_comment(
    step_id: UUID,
    payload: schemas.StepCommentCreate,
    db: DBSession,
    current_user: CurrentUser,
):
    comment = await services.create_comment(db, step_id, payload, current_user)
    await db.commit()
    return comment


@router.delete(
    "/{step_id}/comments/{comment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_step_comment(
    step_id: UUID,
    comment_id: UUID,
    db: DBSession,
    current_user: CurrentUser,
):
    await services.delete_comment(db, comment_id, current_user)
    await db.commit()