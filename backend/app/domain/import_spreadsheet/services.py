from datetime import date, datetime

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.import_spreadsheet.schemas import (
    REQUIRED_FIELDS,
    ImportIssue,
    ValidatedRow,
)
from app.domain.action_plan_step.models import ActionPlanStep, StepStatus
from app.domain.key_result.models import KeyResult
from app.domain.strategic_initiative.models import StrategicInitiative
from app.domain.strategic_objective.models import StrategicObjective
from app.domain.strategic_perspective.models import StrategicPerspective

_DATE_FORMATS = ["%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%Y/%m/%d", "%d/%m/%y"]

# Aceita os valores novos (inglês) e os antigos (português) para tolerância com planilhas legadas
_STATUS_MAP = {
    "not started": StepStatus.NOT_STARTED,
    "in progress": StepStatus.IN_PROGRESS,
    "completed": StepStatus.COMPLETED,
    "delayed": StepStatus.DELAYED,
    "a iniciar": StepStatus.NOT_STARTED,
    "em andamento": StepStatus.IN_PROGRESS,
    "concluido": StepStatus.COMPLETED,
    "concluído": StepStatus.COMPLETED,
    "atrasado": StepStatus.DELAYED,
}


def _parse_date(raw: object) -> date | None:
    if raw is None or raw == "":
        return None
    if isinstance(raw, datetime):
        return raw.date()
    if isinstance(raw, date):
        return raw
    s = str(raw).strip()
    for fmt in _DATE_FORMATS:
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    return None


def _parse_status(raw: object) -> StepStatus | None:
    if raw is None:
        return None
    return _STATUS_MAP.get(str(raw).strip().lower())


def validate_grid(
    grid: list[list], mapping: dict[str, int]
) -> tuple[list[ValidatedRow], list[ImportIssue]]:
    issues: list[ImportIssue] = []

    missing = [f for f in REQUIRED_FIELDS if f not in mapping]
    if missing:
        for f in missing:
            issues.append(
                ImportIssue(line=1, field=f, message=f"Campo obrigatório não mapeado: {f}")
            )
        return [], issues

    data_rows = grid[1:]
    valid: list[ValidatedRow] = []

    for idx, row in enumerate(data_rows, start=2):

        def get(key: str) -> object:
            col = mapping.get(key)
            return row[col] if col is not None and col < len(row) else None

        # Datas
        d_ini_prev = _parse_date(get("planned_start_date"))
        d_fim_prev = _parse_date(get("planned_end_date"))
        d_ini_real = _parse_date(get("actual_start_date"))
        d_fim_real = _parse_date(get("actual_end_date"))

        row_ok = True
        if d_ini_prev is None:
            issues.append(
                ImportIssue(line=idx, field="planned_start_date", message="Data inválida ou ausente")
            )
            row_ok = False
        if d_fim_prev is None:
            issues.append(
                ImportIssue(line=idx, field="planned_end_date", message="Data inválida ou ausente")
            )
            row_ok = False
        if d_ini_prev and d_fim_prev and d_fim_prev < d_ini_prev:
            issues.append(
                ImportIssue(
                    line=idx,
                    field="planned_end_date",
                    message="Término previsto anterior ao início",
                )
            )
            row_ok = False

        # Status
        status = _parse_status(get("status"))
        if status is None:
            issues.append(
                ImportIssue(line=idx, field="status", message=f"Status inválido: {get('status')!r}")
            )
            row_ok = False

        # Nº sequencial
        try:
            numero = int(str(get("sequential_number")).strip())
        except (TypeError, ValueError):
            issues.append(
                ImportIssue(line=idx, field="sequential_number", message="Número sequencial inválido")
            )
            row_ok = False
            numero = 0

        # Strings obrigatórias
        str_fields = {
            "perspective": "perspective",
            "objective": "objective",
            "responsible_sector": "responsible_sector",
            "initiative_name": "initiative_name",
            "responsible_manager": "responsible_manager",
            "summary": "summary",
            "kr_code": "kr_code",
            "kr_name": "kr_name",
            "kr_goal": "kr_goal",
            "step_name": "step_name",
            "responsible": "responsible",
        }
        parsed: dict[str, str] = {}
        for key, field in str_fields.items():
            val = get(key)
            sval = str(val).strip() if val is not None else ""
            if not sval:
                issues.append(ImportIssue(line=idx, field=field, message="Valor obrigatório em branco"))
                row_ok = False
            parsed[field] = sval

        if not row_ok:
            continue

        valid.append(
            ValidatedRow(
                **parsed,
                total_estimated_value=str(get("total_estimated_value") or "").strip() or None,
                current_year_estimated_value=str(get("current_year_estimated_value") or "").strip()
                or None,
                sequential_number=numero,
                planned_start_date=d_ini_prev,  # type: ignore[arg-type]
                planned_end_date=d_fim_prev,    # type: ignore[arg-type]
                actual_start_date=d_ini_real,
                actual_end_date=d_fim_real,
                status=status.value if status else "Not Started",
            )
        )

    return valid, issues


async def commit_import(
    db: AsyncSession, rows: list[ValidatedRow], mode: str
) -> dict[str, int]:
    counts = {
        "strategic_perspectives_created": 0,
        "strategic_objectives_created": 0,
        "initiatives_created": 0,
        "key_results_created": 0,
        "steps_upserted": 0,
        "steps_deleted": 0,
    }

    persp_cache: dict[str, StrategicPerspective] = {}
    obj_cache: dict[tuple[str, str], StrategicObjective] = {}
    inic_cache: dict[tuple[str, str], StrategicInitiative] = {}
    kr_cache: dict[tuple[str, str], KeyResult] = {}

    if mode == "replace":
        res = await db.execute(delete(ActionPlanStep))
        counts["steps_deleted"] = res.rowcount or 0

    for row in rows:
        # StrategicPerspective
        p = persp_cache.get(row.perspective)
        if not p:
            p = (
                await db.execute(
                    select(StrategicPerspective).where(
                        StrategicPerspective.name == row.perspective
                    )
                )
            ).scalar_one_or_none()
            if not p:
                p = StrategicPerspective(name=row.perspective)
                db.add(p)
                await db.flush()
                counts["strategic_perspectives_created"] += 1
            persp_cache[row.perspective] = p

        # StrategicObjective
        okey = (str(p.id), row.objective)
        o = obj_cache.get(okey)
        if not o:
            o = (
                await db.execute(
                    select(StrategicObjective).where(
                        StrategicObjective.strategic_perspective_id == p.id,
                        StrategicObjective.name == row.objective,
                    )
                )
            ).scalar_one_or_none()
            if not o:
                o = StrategicObjective(strategic_perspective_id=p.id, name=row.objective)
                db.add(o)
                await db.flush()
                counts["strategic_objectives_created"] += 1
            obj_cache[okey] = o

        # StrategicInitiative
        ikey = (str(o.id), row.initiative_name)
        i = inic_cache.get(ikey)
        if not i:
            i = (
                await db.execute(
                    select(StrategicInitiative).where(
                        StrategicInitiative.strategic_objective_id == o.id,
                        StrategicInitiative.name == row.initiative_name,
                    )
                )
            ).scalar_one_or_none()
            if not i:
                i = StrategicInitiative(
                    strategic_objective_id=o.id,
                    responsible_sector=row.responsible_sector,
                    name=row.initiative_name,
                    responsible_manager=row.responsible_manager,
                    summary=row.summary,
                    total_estimated_value=row.total_estimated_value,
                    current_year_estimated_value=row.current_year_estimated_value,
                )
                db.add(i)
                await db.flush()
                counts["initiatives_created"] += 1
            inic_cache[ikey] = i

        # KeyResult
        kkey = (str(i.id), row.kr_code)
        kr = kr_cache.get(kkey)
        if not kr:
            kr = (
                await db.execute(
                    select(KeyResult).where(
                        KeyResult.initiative_id == i.id,
                        KeyResult.code == row.kr_code,
                    )
                )
            ).scalar_one_or_none()
            if not kr:
                kr = KeyResult(
                    initiative_id=i.id,
                    code=row.kr_code,
                    name=row.kr_name,
                    goal=row.kr_goal,
                )
                db.add(kr)
                await db.flush()
                counts["key_results_created"] += 1
            kr_cache[kkey] = kr

        # ActionPlanStep (upsert por sequential_number dentro do KR)
        step = (
            await db.execute(
                select(ActionPlanStep).where(
                    ActionPlanStep.key_result_id == kr.id,
                    ActionPlanStep.sequential_number == row.sequential_number,
                )
            )
        ).scalar_one_or_none()

        if not step:
            step = ActionPlanStep(
                key_result_id=kr.id,
                sequential_number=row.sequential_number,
                name=row.step_name,
                planned_start_date=row.planned_start_date,
                planned_end_date=row.planned_end_date,
                actual_start_date=row.actual_start_date,
                actual_end_date=row.actual_end_date,
                responsible=row.responsible,
                status=StepStatus(row.status),
            )
            db.add(step)
        else:
            step.name = row.step_name
            step.planned_start_date = row.planned_start_date
            step.planned_end_date = row.planned_end_date
            step.actual_start_date = row.actual_start_date
            step.actual_end_date = row.actual_end_date
            step.responsible = row.responsible
            step.status = StepStatus(row.status)

        counts["steps_upserted"] += 1

    return counts