from datetime import date

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.import_spreadsheet.schemas import ValidatedRow
from app.domain.action_plan_step.models import ActionPlanStep, StepStatus
from app.domain.delay_justification.models import DelayJustification
from app.domain.key_result.models import KeyResult
from app.domain.strategic_initiative.models import StrategicInitiative
from app.domain.strategic_objective.models import StrategicObjective
from app.domain.strategic_perspective.models import StrategicPerspective


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
        "justificativas_upserted": 0,
    }

    persp_cache: dict[str, StrategicPerspective] = {}
    obj_cache: dict[tuple[str, str], StrategicObjective] = {}
    inic_cache: dict[tuple[str, str], StrategicInitiative] = {}
    kr_cache: dict[tuple[str, str], KeyResult] = {}

    if mode == "replace":
        res = await db.execute(delete(ActionPlanStep))
        counts["steps_deleted"] = res.rowcount or 0

    for row in rows:
        # ─── StrategicPerspective ───
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

        # ─── StrategicObjective ───
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

        # ─── StrategicInitiative ───
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

        # ─── KeyResult ───
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

        # ─── ActionPlanStep (upsert por sequential_number dentro do KR) ───
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
            await db.flush()
        else:
            step.name = row.step_name
            step.planned_start_date = row.planned_start_date
            step.planned_end_date = row.planned_end_date
            step.actual_start_date = row.actual_start_date
            step.actual_end_date = row.actual_end_date
            step.responsible = row.responsible
            step.status = StepStatus(row.status)

        counts["steps_upserted"] += 1

        if row.justificativas:
            existing = (
                await db.execute(
                    select(DelayJustification).where(
                        DelayJustification.step_id == step.id
                    )
                )
            ).scalars().all()
            existing_by_date = {j.registration_date: j for j in existing}

            for jdata in row.justificativas:
                reg_date = jdata.data_registro or date.today()
                found = existing_by_date.get(reg_date)

                if found:
                    found.corrective_action = jdata.acao_corretiva or jdata.problema
                    found.responsible = jdata.responsavel or row.responsible
                    found.solution_forecast = jdata.previsao_solucao or date.today()
                    found.under_arpe_governance = jdata.sob_governanca_arpe
                    found.resolved = jdata.resolvido
                else:
                    db.add(
                        DelayJustification(
                            step_id=step.id,
                            registration_date=reg_date,
                            corrective_action=jdata.acao_corretiva or jdata.problema,
                            responsible=jdata.responsavel or row.responsible,
                            solution_forecast=jdata.previsao_solucao or date.today(),
                            under_arpe_governance=jdata.sob_governanca_arpe,
                            resolved=jdata.resolvido,
                        )
                    )
                counts["justificativas_upserted"] += 1

    return counts