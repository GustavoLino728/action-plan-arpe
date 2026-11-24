from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError, NotFoundError
from app.domain.strategic_initiative.models import StrategicInitiative
from app.domain.users.models import User


ROLE_ADMIN = "admin"
ROLE_DIRETOR = "diretor"
ROLE_COORDENADOR = "coordenador"
ROLE_SERVIDOR = "servidor"


def _is_oversight(user: User | None) -> bool:
    if not user or not user.department:
        return False
    return user.department.is_oversight is True


def can_view_all_initiatives(user: User | None) -> bool:
    """Admin, diretor ou membro de setor CGRP."""
    if not user:
        return False
    if user.role in (ROLE_ADMIN, ROLE_DIRETOR):
        return True
    return _is_oversight(user)


# ─── Permissões de escrita (mesma regra hoje) ───
def can_manage_perspectives(user: User | None) -> bool:
    return can_view_all_initiatives(user)


def can_manage_objectives(user: User | None) -> bool:
    return can_view_all_initiatives(user)


def can_manage_initiatives(user: User | None) -> bool:
    return can_view_all_initiatives(user)


def can_import_spreadsheet(user: User | None) -> bool:
    if not user:
        return False
    if user.role in (ROLE_ADMIN, ROLE_DIRETOR, ROLE_COORDENADOR):
        return True
    return _is_oversight(user)


def can_manage_users(user: User | None) -> bool:
    return bool(user and user.role == ROLE_ADMIN)


def can_manage_departments(user: User | None) -> bool:
    return bool(user and user.role == ROLE_ADMIN)


# ─── Acesso a uma iniciativa específica (leitura/escrita) ───
async def assert_can_access_initiative(
    db: AsyncSession,
    initiative_id: UUID,
    current_user: User,
) -> StrategicInitiative:
    """Garante que o usuário pode ler/editar a iniciativa.
    - admin/diretor/CGRP → qualquer iniciativa
    - coordenador/servidor → só do próprio setor
    Retorna a iniciativa para reuso (evita 2 queries)."""
    initiative = await db.get(StrategicInitiative, initiative_id)
    if not initiative:
        raise NotFoundError("Iniciativa não encontrada")

    if can_view_all_initiatives(current_user):
        return initiative

    if initiative.department_id != current_user.department_id:
        raise ForbiddenError("Sem permissão para acessar esta iniciativa")

    return initiative


async def resolve_initiative_for_key_result(
    db: AsyncSession,
    key_result_id: UUID,
) -> StrategicInitiative:
    """A partir de um KR, descobre a iniciativa."""
    from app.domain.key_result.models import KeyResult

    kr = await db.get(KeyResult, key_result_id)
    if not kr:
        raise NotFoundError("Key Result não encontrado")

    initiative = await db.get(StrategicInitiative, kr.initiative_id)
    if not initiative:
        raise NotFoundError("Iniciativa do KR não encontrada")
    return initiative


async def resolve_initiative_for_step(
    db: AsyncSession,
    step_id: UUID,
) -> StrategicInitiative:
    """A partir de uma etapa, descobre a iniciativa."""
    from app.domain.action_plan_step.models import ActionPlanStep
    from app.domain.key_result.models import KeyResult

    step = await db.get(ActionPlanStep, step_id)
    if not step:
        raise NotFoundError("Etapa não encontrada")

    kr = await db.get(KeyResult, step.key_result_id)
    if not kr:
        raise NotFoundError("KR da etapa não encontrado")

    initiative = await db.get(StrategicInitiative, kr.initiative_id)
    if not initiative:
        raise NotFoundError("Iniciativa do KR não encontrada")
    return initiative