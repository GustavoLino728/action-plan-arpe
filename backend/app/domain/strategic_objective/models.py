import uuid
from typing import TYPE_CHECKING, List

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.domain.strategic_perspective.models import StrategicPerspective
    from app.domain.strategic_initiative.models import StrategicInitiative


class StrategicObjective(Base, TimestampMixin):
    __tablename__ = "strategic_objectives"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    strategic_perspective_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("strategic_perspectives.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    strategic_perspective: Mapped["StrategicPerspective"] = relationship(
        back_populates="strategic_objectives"
    )
    
    initiatives: Mapped[List["StrategicInitiative"]] = relationship(
        back_populates="strategic_objective", cascade="all, delete-orphan"
    )