import enum
from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Enum as SAEnum, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin


class ImportMode(str, enum.Enum):
    APPEND = "append"
    REPLACE = "replace"


class ImportUpload(Base, TimestampMixin):
    __tablename__ = "import_uploads"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    user_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    user_name: Mapped[str] = mapped_column(String(255), nullable=False)
    source_file_name: Mapped[str | None] = mapped_column(String(500), nullable=True)

    mode: Mapped[ImportMode] = mapped_column(
        SAEnum(
            ImportMode,
            name="import_mode_enum",
            values_callable=lambda x: [e.value for e in x],
        ),
        nullable=False,
    )

    strategic_perspectives_created: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    strategic_objectives_created: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    initiatives_created: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    key_results_created: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    steps_upserted: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    steps_deleted: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    justificativas_upserted: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    request_id: Mapped[str | None] = mapped_column(String(64), nullable=True)

    user = relationship("User", lazy="joined")