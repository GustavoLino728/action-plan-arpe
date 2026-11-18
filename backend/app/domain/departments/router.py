from uuid import UUID

from fastapi import APIRouter, status

from app.dependencies import CurrentUser, DBSession
from app.domain.departments import schemas, services

router = APIRouter(prefix="/api/v1/departments", tags=["ARPE - Setores"])


@router.get("/", response_model=list[schemas.DepartmentRead])
async def list_departments(db: DBSession, current_user: CurrentUser):
    return await services.list_all(db)


@router.get("/{dept_id}", response_model=schemas.DepartmentRead)
async def get_department(dept_id: UUID, db: DBSession, current_user: CurrentUser):
    return await services.get_by_id(db, dept_id)


@router.post(
    "/", response_model=schemas.DepartmentRead, status_code=status.HTTP_201_CREATED
)
async def create_department(
    payload: schemas.DepartmentCreate, db: DBSession, current_user: CurrentUser
):
    dept = await services.create(db, payload)
    await db.commit()
    return dept


@router.patch("/{dept_id}", response_model=schemas.DepartmentRead)
async def update_department(
    dept_id: UUID,
    payload: schemas.DepartmentUpdate,
    db: DBSession,
    current_user: CurrentUser,
):
    dept = await services.update(db, dept_id, payload)
    await db.commit()
    return dept


@router.delete("/{dept_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_department(
    dept_id: UUID, db: DBSession, current_user: CurrentUser
):
    await services.delete(db, dept_id)
    await db.commit()