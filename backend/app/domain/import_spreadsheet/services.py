from datetime import date, datetime

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.import_spreadsheet.schemas import (
    FIELD_KEYS, REQUIRED_FIELDS, ImportIssue, ValidatedRow,
)
from app.domain.strategic_initiative.models import StrategicInitiative
from app.domain.key_result.models import KeyResult
from app.domain.strategic_objective_estrategico.models import StrategicObjective
from app.domain.strategic_perspective.models import StrategicPerspective
from app.domain.etapa_plano_acao.models import ActionPlanStep, StepStatus

_DATE_FORMATS = ["%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%Y/%m/%d", "%d/%m/%y"]

_STATUS_MAP = {
    "a iniciar": StepStatus.A_INICIAR,
    "em andamento": StepStatus.EM_ANDAMENTO,
    "concluido": StepStatus.CONCLUIDO,
    "concluído": StepStatus.CONCLUIDO,
    "atrasado": StepStatus.ATRASADO,
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


def validate_grid(grid: list[list], mapping: dict[str, int]) -> tuple[list[ValidatedRow], list[ImportIssue]]:
    issues: list[ImportIssue] = []

    # 1) Campos obrigatórios no mapeamento
    missing = [f for f in REQUIRED_FIELDS if f not in mapping]
    if missing:
        for f in missing:
            issues.append(ImportIssue(line=1, field=f, message=f"Campo obrigatório não mapeado: {f}"))
        return [], issues

    headers = grid[0]
    data_rows = grid[1:]
    valid: list[ValidatedRow] = []

    for idx, row in enumerate(data_rows, start=2):
        def get(key: str) -> object:
            col = mapping.get(key)
            return row[col] if col is not None and col < len(row) else None

        # 2) Datas
        d_ini_prev = _parse_date(get("data_inicio_previsto"))
        d_fim_prev = _parse_date(get("data_termino_previsto"))
        d_ini_real = _parse_date(get("data_inicio_realizado"))
        d_fim_real = _parse_date(get("data_termino_realizado"))

        row_ok = True
        if d_ini_prev is None:
            issues.append(ImportIssue(line=idx, field="data_inicio_previsto", message="Data inválida ou ausente"))
            row_ok = False
        if d_fim_prev is None:
            issues.append(ImportIssue(line=idx, field="data_termino_previsto", message="Data inválida ou ausente"))
            row_ok = False
        if d_ini_prev and d_fim_prev and d_fim_prev < d_ini_prev:
            issues.append(ImportIssue(line=idx, field="data_termino_previsto", message="Término previsto anterior ao início"))
            row_ok = False

        # 3) Status
        status = _parse_status(get("status"))
        if status is None:
            issues.append(ImportIssue(line=idx, field="status", message=f"Status inválido: {get('status')!r}"))
            row_ok = False

        # 4) Nº sequencial
        try:
            numero = int(str(get("numero_sequencial")).strip())
        except (TypeError, ValueError):
            issues.append(ImportIssue(line=idx, field="numero_sequencial", message="Número sequencial inválido"))
            row_ok = False
            numero = 0

        # 5) Strings obrigatórias
        str_fields = {
            "strategic_perspective": "strategic_perspective", "strategic_objective": "strategic_objective",
            "setor_responsavel": "setor_responsavel", "nome_iniciativa": "nome_iniciativa",
            "gestor_responsavel": "gestor_responsavel", "descricao_resumida": "descricao_resumida",
            "codigo_kr": "codigo_kr", "nome_kr": "nome_kr", "meta_kr": "meta_kr",
            "nome_etapa": "nome_etapa", "responsavel_etapa": "responsavel_etapa",
        }
        parsed = {}
        for key, field in str_fields.items():
            val = get(key)
            sval = str(val).strip() if val is not None else ""
            if not sval:
                issues.append(ImportIssue(line=idx, field=field, message="Valor obrigatório em branco"))
                row_ok = False
            parsed[field] = sval

        if not row_ok:
            continue

        valid.append(ValidatedRow(
            **parsed,
            valor_estimado_total=str(get("valor_estimado_total") or "").strip() or None,
            valor_estimado_ano_vigente=str(get("valor_estimado_ano_vigente") or "").strip() or None,
            numero_sequencial=numero,
            data_inicio_previsto=d_ini_prev,  # type: ignore[arg-type]
            data_termino_previsto=d_fim_prev,  # type: ignore[arg-type]
            data_inicio_realizado=d_ini_real,
            data_termino_realizado=d_fim_real,
            status=status.value,  # type: ignore[union-attr]
        ))

    return valid, issues


async def commit_import(db: AsyncSession, rows: list[ValidatedRow], mode: str) -> dict[str, int]:
    counts = {
        "strategic_perspectives_created": 0, "strategic_objectives_created": 0,
        "iniciativas_created": 0, "key_results_created": 0,
        "etapas_upserted": 0, "etapas_deleted": 0,
    }

    # Cache em memória por chave natural
    persp_cache: dict[str, StrategicPerspective] = {}
    obj_cache: dict[tuple[str, str], StrategicObjective] = {}
    inic_cache: dict[tuple[str, str], StrategicInitiative] = {}
    kr_cache: dict[tuple[str, str], KeyResult] = {}

    # --- mode=replace: apaga todas as etapas antes (mantém entidades pai) ---
    # Se você quer wipe total, use delete em cascata a partir de StrategicPerspective.
    if mode == "replace":
        res = await db.execute(delete(ActionPlanStep))
        counts["etapas_deleted"] = res.rowcount or 0

    for row in rows:
        # StrategicPerspective
        p = persp_cache.get(row.strategic_perspective)
        if not p:
            p = (await db.execute(
                select(StrategicPerspective).where(StrategicPerspective.nome == row.strategic_perspective)
            )).scalar_one_or_none()
            if not p:
                p = StrategicPerspective(nome=row.strategic_perspective)
                db.add(p)
                await db.flush()
                counts["strategic_perspectives_created"] += 1
            persp_cache[row.strategic_perspective] = p

        # strategic_objective
        okey = (str(p.id), row.strategic_objective)
        o = obj_cache.get(okey)
        if not o:
            o = (await db.execute(
                select(StrategicObjective).where(
                    StrategicObjective.strategic_perspective_id == p.id,
                    StrategicObjective.nome == row.strategic_objective,
                )
            )).scalar_one_or_none()
            if not o:
                o = StrategicObjective(strategic_perspective_id=p.id, nome=row.strategic_objective)
                db.add(o)
                await db.flush()
                counts["strategic_objectives_created"] += 1
            obj_cache[okey] = o

        # Iniciativa
        ikey = (str(o.id), row.nome_iniciativa)
        i = inic_cache.get(ikey)
        if not i:
            i = (await db.execute(
                select(StrategicInitiative).where(
                    StrategicInitiative.strategic_objective_id == o.id,
                    StrategicInitiative.nome_iniciativa == row.nome_iniciativa,
                )
            )).scalar_one_or_none()
            if not i:
                i = StrategicInitiative(
                    strategic_objective_id=o.id,
                    setor_responsavel=row.setor_responsavel,
                    nome_iniciativa=row.nome_iniciativa,
                    gestor_responsavel=row.gestor_responsavel,
                    descricao_resumida=row.descricao_resumida,
                    valor_estimado_total=row.valor_estimado_total,
                    valor_estimado_ano_vigente=row.valor_estimado_ano_vigente,
                )
                db.add(i)
                await db.flush()
                counts["iniciativas_created"] += 1
            inic_cache[ikey] = i

        # Key Result
        kkey = (str(i.id), row.codigo_kr)
        kr = kr_cache.get(kkey)
        if not kr:
            kr = (await db.execute(
                select(KeyResult).where(
                    KeyResult.iniciativa_id == i.id,
                    KeyResult.codigo_kr == row.codigo_kr,
                )
            )).scalar_one_or_none()
            if not kr:
                kr = KeyResult(
                    iniciativa_id=i.id,
                    codigo_kr=row.codigo_kr,
                    nome_kr=row.nome_kr,
                    meta_qualitativa_quantitativa=row.meta_kr,
                )
                db.add(kr)
                await db.flush()
                counts["key_results_created"] += 1
            kr_cache[kkey] = kr

        # Etapa (upsert por numero_sequencial dentro do KR)
        etapa = (await db.execute(
            select(ActionPlanStep).where(
                ActionPlanStep.key_result_id == kr.id,
                ActionPlanStep.numero_sequencial == row.numero_sequencial,
            )
        )).scalar_one_or_none()

        if not etapa:
            etapa = ActionPlanStep(
                key_result_id=kr.id,
                numero_sequencial=row.numero_sequencial,
                nome_etapa=row.nome_etapa,
                data_inicio_previsto=row.data_inicio_previsto,
                data_termino_previsto=row.data_termino_previsto,
                data_inicio_realizado=row.data_inicio_realizado,
                data_termino_realizado=row.data_termino_realizado,
                responsavel_etapa=row.responsavel_etapa,
                status=StepStatus(row.status),
            )
            db.add(etapa)
        else:
            etapa.nome_etapa = row.nome_etapa
            etapa.data_inicio_previsto = row.data_inicio_previsto
            etapa.data_termino_previsto = row.data_termino_previsto
            etapa.data_inicio_realizado = row.data_inicio_realizado
            etapa.data_termino_realizado = row.data_termino_realizado
            etapa.responsavel_etapa = row.responsavel_etapa
            etapa.status = StepStatus(row.status)

        counts["etapas_upserted"] += 1

    return counts