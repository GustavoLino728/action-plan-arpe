import uuid
from typing import TYPE_CHECKING, List

from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.domain.strategic_objective.models import StrategicObjective


class StrategicPerspective(Base, TimestampMixin):
    __tablename__ = "strategic_perspectives"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    strategic_objectives: Mapped[List["StrategicObjective"]] = relationship(
        back_populates="strategic_perspective", cascade="all, delete-orphan"
    )