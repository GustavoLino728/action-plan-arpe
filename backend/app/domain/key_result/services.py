from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.domain.key_result import models, schemas


async def update_key_result(
    db: AsyncSession,
    kr_id: UUID,
    payload: schemas.KeyResultUpdate,
) -> models.KeyResult:
    kr = await db.get(models.KeyResult, kr_id)
    if not kr:
        raise NotFoundError("Key Result não encontrado")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(kr, field, value)

    await db.flush()
    await db.refresh(kr)
    return kr


async def delete_key_result(db: AsyncSession, kr_id: UUID) -> None:
    kr = await db.get(models.KeyResult, kr_id)
    if not kr:
        raise NotFoundError("Key Result não encontrado")
    await db.delete(kr)
    await db.flush()