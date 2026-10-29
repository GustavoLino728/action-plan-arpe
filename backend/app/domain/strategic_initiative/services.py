from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.domain.strategic_initiative import models, schemas


async def update_initiative(
    db: AsyncSession,
    initiative_id: UUID,
    payload: schemas.StrategicInitiativeUpdate,
) -> models.StrategicInitiative:
    initiative = await db.get(models.StrategicInitiative, initiative_id)
    if not initiative:
        raise NotFoundError("Iniciativa não encontrada")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(initiative, field, value)

    await db.flush()
    await db.refresh(initiative)
    return initiative


async def delete_initiative(db: AsyncSession, initiative_id: UUID) -> None:
    initiative = await db.get(models.StrategicInitiative, initiative_id)
    if not initiative:
        raise NotFoundError("Iniciativa não encontrada")
    await db.delete(initiative)
    await db.flush()