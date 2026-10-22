from fastapi import APIRouter, HTTPException, status

from app.dependencies import DBSession, CurrentUser
from app.domain.import_spreadsheet import schemas, services

router = APIRouter(prefix="/api/v1/import", tags=["ARPE - Importação"])


@router.post("/preview", response_model=schemas.ImportPreviewResponse)
async def preview_import(
    payload: schemas.ImportPreviewRequest,
    db: DBSession,
    current_user: CurrentUser,
):
    valid, issues = services.validate_grid(payload.grid, payload.mapping)
    return schemas.ImportPreviewResponse(
        valid_rows=valid,
        issues=issues,
        summary={
            "total_lines": len(payload.grid) - 1,
            "valid": len(valid),
            "invalid": len(issues),
        },
    )


@router.post("/commit", response_model=schemas.ImportCommitResponse, status_code=status.HTTP_201_CREATED)
async def commit_import(
    payload: schemas.ImportCommitRequest,
    db: DBSession,
    current_user: CurrentUser,
):
    if not payload.rows:
        raise HTTPException(status_code=400, detail="Nenhuma linha válida para importar.")

    counts = await services.commit_import(db, payload.rows, payload.mode)
    await db.commit()
    return schemas.ImportCommitResponse(**counts)