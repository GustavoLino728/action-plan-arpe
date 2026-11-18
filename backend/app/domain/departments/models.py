import uuid

from sqlalchemy import Boolean, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base, TimestampMixin


class Department(Base, TimestampMixin):
    __tablename__ = "departments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    acronym: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    is_oversight: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False, index=True
    )