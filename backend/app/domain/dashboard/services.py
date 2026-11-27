from datetime import date, timedelta
from uuid import UUID

from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domain.action_plan_step.models import ActionPlanStep, StepStatus
from app.domain.dashboard.schemas import (
    DashboardCards, DashboardOverview, Farol, KrAlert,
)
from app.domain.key_result.models import KeyResult
from app.domain.strategic_initiative.models import StrategicInitiative
from app.domain.users.models import User

# ────────── Regra do farol (Opção A: desvio em pontos percentuais) ──────────

_AMARELO_PP = -20   # desvio >= -20 → amarelo


def _expected_progress(
    planned_start: date | None,
    planned_end: date | None,
    today: date,
) -> int:
    """Progresso esperado (0..100), linear entre início e fim. Espelha
    lib/plan-utils.ts:expectedProgress para não divergir do frontend."""
    if not planned_start or not planned_end:
        return 0
    total = (planned_end - planned_start).days
    if total <= 0:
        return 100 if today >= planned_end else 0
    elapsed = (today - planned_start).days
    return max(0, min(100, round(elapsed / total * 100)))


def compute_farol(
    *,
    percentage_progress: int,
    planned_start: date | None,
    planned_end: date | None,
    today: date,
) -> tuple[Farol | None, int, int]:
    """
    Retorna (farol, expected_progress, days_to_deadline).

    - farol = None  → "sem_prazo" (KR não computável, faltam datas)
    - farol = "verde" | "amarelo" | "vermelho"

    Regras (Opção A):
      1. progress >= 100 → verde
      2. sem planned_start OU sem planned_end → None (sem_prazo)
      3. planned_end < today e não concluído → vermelho
      4. planned_start > today → verde (ainda não começou)
      5. calcula desvio = progress - expected
         desvio >= 0    → verde
         desvio >= -20  → amarelo
         desvio < -20   → vermelho
    """
    days_to_deadline = (
        (planned_end - today).days if planned_end else 0
    )

    if percentage_progress >= 100:
        return ("verde", 100, days_to_deadline)

    if not planned_start or not planned_end:
        return (None, 0, days_to_deadline)

    if planned_end < today:
        # prazo vencido e não concluído → vermelho independente de progresso
        return ("vermelho", _expected_progress(planned_start, planned_end, today), days_to_deadline)

    if planned_start > today:
        return ("verde", 0, days_to_deadline)

    expected = _expected_progress(planned_start, planned_end, today)
    deviation = percentage_progress - expected

    if deviation >= 0:
        farol: Farol = "verde"
    elif deviation >= _AMARELO_PP:
        farol = "amarelo"
    else:
        farol = "vermelho"

    return (farol, expected, days_to_deadline)


# ────────── RBAC ──────────

def _has_full_visibility(user: User) -> bool:
    if user.role in ("admin", "diretor"):
        return True
    if user.department and user.department.is_oversight:
        return True
    return False


# ────────── Endpoint principal ──────────

async def get_overview(
    db: AsyncSession,
    *,
    current_user: User,
    today: date,
    department_id: UUID | None = None,
    farol_filter: set[Farol] | None = None,
) -> DashboardOverview:
    # ── 1. Cards (sempre globais — visão agregada para todos) ──
    all_krs = (
        await db.execute(
            select(KeyResult).options(selectinload(KeyResult.initiative))
        )
    ).scalars().all()

    verde = amarelo = vermelho = sem_prazo = sem_movimento = 0
    hoje = today

    for kr in all_krs:
        farol, _, _ = compute_farol(
            percentage_progress=kr.percentage_progress or 0,
            planned_start=kr.planned_start_date,
            planned_end=kr.planned_end_date,
            today=today,
        )
        if farol is None:
            sem_prazo += 1
        elif farol == "verde":
            verde += 1
        elif farol == "amarelo":
            amarelo += 1
        else:
            vermelho += 1

        if (
            (kr.percentage_progress or 0) == 0
            and kr.planned_start_date
            and kr.planned_end_date
            and kr.planned_start_date <= hoje < kr.planned_end_date
        ):
            sem_movimento += 1

    steps_atrasadas = await db.scalar(
        select(func.count(ActionPlanStep.id)).where(
            or_(
                ActionPlanStep.status == StepStatus.DELAYED,
                and_(
                    ActionPlanStep.status != StepStatus.COMPLETED,
                    ActionPlanStep.planned_end_date < today,
                ),
            )
        )
    ) or 0

    cards = DashboardCards(
        total_krs=len(all_krs),
        verde=verde,
        amarelo=amarelo,
        vermelho=vermelho,
        sem_prazo=sem_prazo,
        krs_sem_movimento=sem_movimento,
        steps_atrasadas=steps_atrasadas,
    )

    full_visibility = _has_full_visibility(current_user)

    effective_department_id = department_id
    if not full_visibility:
        if department_id and department_id != current_user.department_id:
            # tenta filtrar depto alheio → retorna vazio (sem leak)
            return DashboardOverview(
                cards=cards, krs_alerta=[],
                scope="department",
            )
        effective_department_id = current_user.department_id

    stmt = (
        select(KeyResult)
        .options(
            selectinload(KeyResult.initiative).selectinload(
                StrategicInitiative.department
            )
        )
        .join(StrategicInitiative, KeyResult.initiative_id == StrategicInitiative.id)
    )
    if effective_department_id:
        stmt = stmt.where(StrategicInitiative.department_id == effective_department_id)

    krs_scoped = (await db.execute(stmt)).scalars().all()

    alerts: list[KrAlert] = []
    wanted = farol_filter or {"amarelo", "vermelho"}

    for kr in krs_scoped:
        farol, expected, days = compute_farol(
            percentage_progress=kr.percentage_progress or 0,
            planned_start=kr.planned_start_date,
            planned_end=kr.planned_end_date,
            today=today,
        )
        if farol is None or farol not in wanted:
            continue
        initiative = kr.initiative
        department = initiative.department if initiative else None
        alerts.append(
            KrAlert(
                id=kr.id,
                code=kr.code,
                name=kr.name,
                initiative_id=initiative.id if initiative else None,
                initiative_name=initiative.name if initiative else "—",
                department_id=department.id if department else None,
                department_name=department.name if department else None,
                percentage_progress=kr.percentage_progress or 0,
                expected_progress=expected,
                deviation_pp=(kr.percentage_progress or 0) - expected,
                days_to_deadline=days,
                farol=farol,
            )
        )

    alerts.sort(key=lambda a: (a.deviation_pp, a.days_to_deadline))

    return DashboardOverview(
        cards=cards,
        krs_alerta=alerts,
        scope="global" if full_visibility and not department_id else "department",
    )