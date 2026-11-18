import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr
from app.domain.departments.schemas import DepartmentRead


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Literal["servidor", "coordenador", "diretor", "admin"] = "servidor"
    department_id: uuid.UUID | None = None


class UserUpdate(BaseModel):
    name: str | None = None
    is_active: bool | None = None
    role: Literal["servidor", "coordenador", "diretor", "admin"] | None = None
    department_id: uuid.UUID | None = None


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    email: EmailStr
    role: str
    department_id: uuid.UUID | None = None
    department: DepartmentRead | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime