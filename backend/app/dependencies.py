from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.context import set_current_user_id
from app.core.security import decode_access_token
from app.database.session import get_db
from app.domain.users.models import User
from app.core.exceptions import ForbiddenError
from app.core.permissions import (
    can_import_spreadsheet,
    can_manage_initiatives,
    can_manage_objectives,
    can_manage_perspectives,
)

DBSession = Annotated[AsyncSession, Depends(get_db)]

security = HTTPBearer(auto_error=False)


async def get_current_user(
    db: DBSession,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)] = None,
) -> User:
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticação não fornecido.",
        )

    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado.",
        )

    subject = payload.get("sub")
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido.",
        )

    try:
        user_id = UUID(subject)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido.",
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário autenticado não encontrado.",
        )

    set_current_user_id(user_id)
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]

def require_role(role: str):
    async def dependency(current_user: CurrentUser) -> User:
        if current_user.role != role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você não tem permissão para acessar este recurso.",
            )
        return current_user
    return dependency

AdminUser = Annotated[User, Depends(require_role("admin"))]

async def require_can_manage_perspectives(current_user: CurrentUser) -> None:
    if not can_manage_perspectives(current_user):
        raise ForbiddenError("Sem permissão para gerenciar perspectivas")


async def require_can_manage_objectives(current_user: CurrentUser) -> None:
    if not can_manage_objectives(current_user):
        raise ForbiddenError("Sem permissão para gerenciar objetivos")


async def require_can_manage_initiatives(current_user: CurrentUser) -> None:
    if not can_manage_initiatives(current_user):
        raise ForbiddenError("Sem permissão para gerenciar iniciativas")


async def require_can_import_spreadsheet(current_user: CurrentUser) -> None:
    if not can_import_spreadsheet(current_user):
        raise ForbiddenError("Sem permissão para importar planilhas")
