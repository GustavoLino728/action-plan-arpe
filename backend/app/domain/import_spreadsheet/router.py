import time
from uuid import UUID

from fastapi import (
    APIRouter, File, HTTPException, Query, Request, UploadFile, status,
)
from typing import Literal

from app.core.exceptions import ForbiddenError
from app.dependencies import DBSession, CurrentUser
from app.domain.import_spreadsheet import parser, schemas, services

router = APIRouter(prefix="/api/v1/import", tags=["ARPE - Importação"])

_ALLOWED_EXTS = (".xlsx",)
_MAX_SIZE_MB = 20


def _require_import_permission(user) -> None:
    """RBAC §2.2: importação restrita a admin ou membros de setor oversight."""
    is_admin = user.role == "admin"
    is_oversight = bool(user.department and user.department.is_oversight)
    if not (is_admin or is_oversight):
        raise ForbiddenError(
            "Apenas administradores e setores de governança podem importar planilhas."
        )


@router.post("/preview", response_model=schemas.ImportPreviewResponse)
async def preview_import(
    file: UploadFile = File(...),
    db: DBSession = ...,
    current_user: CurrentUser = ...,
):
    _require_import_permission(current_user)

    name = (file.filename or "").lower()
    if not name.endswith(_ALLOWED_EXTS):
        raise HTTPException(
            status_code=400,
            detail=f"Formato não suportado. Envie um arquivo .xlsx (recebido: {file.filename!r}).",
        )

    content = await file.read()
    if len(content) > _MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(400, f"Arquivo excede {_MAX_SIZE_MB} MB.")

    rows, issues, summary = parser.parse_workbook(content)

    return schemas.ImportPreviewResponse(
        valid_rows=rows,
        issues=issues,
        summary={
            "total_lines": len(rows) + len(issues),
            "valid": len(rows),
            "invalid": len(issues),
            **summary,
        },
    )


@router.post(
    "/commit",
    response_model=schemas.ImportCommitResponse,
    status_code=status.HTTP_201_CREATED,
)
async def commit_import(
    payload: schemas.ImportCommitRequest,
    request: Request,
    db: DBSession = ...,
    current_user: CurrentUser = ...,
):
    _require_import_permission(current_user)

    if not payload.rows:
        raise HTTPException(400, "Nenhuma linha válida para importar.")

    request_id = (
        getattr(request.state, "request_id", None)
        or request.headers.get("X-Request-ID")
    )

    t0 = time.perf_counter()
    counts = await services.commit_import(db, payload.rows, payload.mode)
    duration_ms = int((time.perf_counter() - t0) * 1000)

    upload = await services.record_import(
        db,
        user=current_user,
        source_file_name=payload.source_file_name,
        mode=payload.mode,
        counts=counts,
        duration_ms=duration_ms,
        request_id=request_id,
    )

    await db.commit()

    return schemas.ImportCommitResponse(**counts, import_id=upload.id)


@router.get("/history", response_model=schemas.ImportUploadList)
async def list_import_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user_id: UUID | None = None,
    mode: Literal["append", "replace"] | None = None,
    db: DBSession = ...,
    current_user: CurrentUser = ...,
):
    _require_import_permission(current_user)

    items, total = await services.list_imports(
        db, page=page, page_size=page_size, user_id=user_id, mode=mode,
    )
    return schemas.ImportUploadList(
        items=[schemas.ImportUploadOut.model_validate(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
    )