import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictError, NotFoundError
from app.core.security import hash_password
from app.domain.departments.models import Department
from app.domain.users.models import User
from app.domain.users.schemas import UserCreate, UserUpdate


async def _validate_department(
    db: AsyncSession, department_id: uuid.UUID | None
) -> None:
    if department_id is None:
        return
    dept = await db.get(Department, department_id)
    if not dept:
        raise NotFoundError("Setor não encontrado.")


async def create_user(db: AsyncSession, data: UserCreate) -> User:
    result = await db.execute(select(User).filter(User.email == data.email))
    if result.scalars().first():
        raise ConflictError("Já existe um usuário com este e-mail.")

    await _validate_department(db, data.department_id)

    user = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        role=data.role,
        department_id=data.department_id,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def list_users(db: AsyncSession) -> list[User]:
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return list(result.scalars().all())


async def get_user_by_id(db: AsyncSession, user_id: uuid.UUID) -> User:
    result = await db.execute(select(User).filter(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise NotFoundError("Usuário não encontrado.")
    return user


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    result = await db.execute(select(User).filter(User.email == email))
    return result.scalars().first()


async def update_user(
    db: AsyncSession, user_id: uuid.UUID, data: UserUpdate
) -> User:
    user = await get_user_by_id(db, user_id)
    update_data = data.model_dump(exclude_unset=True)

    if "department_id" in update_data:
        await _validate_department(db, update_data["department_id"])

    for field, value in update_data.items():
        setattr(user, field, value)
    await db.commit()
    await db.refresh(user)
    return user


async def delete_user(db: AsyncSession, user_id: uuid.UUID) -> None:
    user = await get_user_by_id(db, user_id)
    await db.delete(user)
    await db.commit()