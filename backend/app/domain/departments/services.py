from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError
from app.domain.departments import models, schemas


async def list_all(db: AsyncSession) -> list[models.Department]:
    result = await db.execute(
        select(models.Department).order_by(models.Department.name)
    )
    return list(result.scalars().all())


async def get_by_id(db: AsyncSession, dept_id: UUID) -> models.Department:
    dept = await db.get(models.Department, dept_id)
    if not dept:
        raise NotFoundError("Setor não encontrado")
    return dept


async def create(
    db: AsyncSession, payload: schemas.DepartmentCreate
) -> models.Department:
    existing = (
        await db.execute(
            select(models.Department).where(models.Department.name == payload.name)
        )
    ).scalar_one_or_none()
    if existing:
        raise ConflictError("Já existe um setor com este nome")

    dept = models.Department(**payload.model_dump())
    db.add(dept)
    await db.flush()
    await db.refresh(dept)
    return dept


async def update(
    db: AsyncSession, dept_id: UUID, payload: schemas.DepartmentUpdate
) -> models.Department:
    dept = await get_by_id(db, dept_id)

    data = payload.model_dump(exclude_unset=True)
    if "name" in data and data["name"] != dept.name:
        existing = (
            await db.execute(
                select(models.Department).where(models.Department.name == data["name"])
            )
        ).scalar_one_or_none()
        if existing:
            raise ConflictError("Já existe um setor com este nome")

    for field, value in data.items():
        setattr(dept, field, value)

    await db.flush()
    await db.refresh(dept)
    return dept


async def delete(db: AsyncSession, dept_id: UUID) -> None:
    dept = await get_by_id(db, dept_id)
    await db.delete(dept)
    await db.flush()