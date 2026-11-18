from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class DepartmentBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    acronym: str | None = Field(None, max_length=50)
    is_oversight: bool = False


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(BaseModel):
    name: str | None = None
    acronym: str | None = None
    is_oversight: bool | None = None


class DepartmentRead(DepartmentBase):
    id: UUID
    model_config = ConfigDict(from_attributes=True)