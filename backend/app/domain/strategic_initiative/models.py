import uuid
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin

if TYPE_CHECKING:
    # CORREÇÃO: Removido o "_estrategico" do import
    from app.domain.strategic_objective.models import StrategicObjective
    from app.domain.key_result.models import KeyResult


class StrategicInitiative(Base, TimestampMixin):
    __tablename__ = "strategic_initiatives"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    strategic_objective_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("strategic_objectives.id", ondelete="CASCADE"), nullable=False
    )
    
    responsible_sector: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    responsible_manager: Mapped[str] = mapped_column(String(255), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    total_estimated_value: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    current_year_estimated_value: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    strategic_objective: Mapped["StrategicObjective"] = relationship(back_populates="initiatives")
    
    key_results: Mapped[List["KeyResult"]] = relationship(
        back_populates="initiative", cascade="all, delete-orphan"
    )