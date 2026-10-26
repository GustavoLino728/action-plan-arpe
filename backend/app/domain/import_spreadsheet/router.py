from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.dependencies import DBSession, CurrentUser
from app.domain.import_spreadsheet import schemas, services, parser

router = APIRouter(prefix="/api/v1/import", tags=["ARPE - Importação"])

_ALLOWED_EXTS = (".xlsx",)
_MAX_SIZE_MB = 20


@router.post("/preview", response_model=schemas.ImportPreviewResponse)
async def preview_import(
    file: UploadFile = File(...),
    db: DBSession = ...,
    current_user: CurrentUser = ...,
):
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


@router.post("/commit", response_model=schemas.ImportCommitResponse, status_code=201)
async def commit_import(
    payload: schemas.ImportCommitRequest,
    db: DBSession = ...,
    current_user: CurrentUser = ...,
):
    if not payload.rows:
        raise HTTPException(400, "Nenhuma linha válida para importar.")
    counts = await services.commit_import(db, payload.rows, payload.mode)
    await db.commit()
    return schemas.ImportCommitResponse(**counts)