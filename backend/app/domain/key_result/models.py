import uuid
from datetime import date
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Date, Enum, Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.domain.action_plan_step.models import ActionPlanStep, StepStatus
    from app.domain.strategic_initiative.models import StrategicInitiative

from app.domain.action_plan_step.models import StepStatus


class KeyResult(Base, TimestampMixin):
    __tablename__ = "key_results"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    initiative_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("strategic_initiatives.id", ondelete="CASCADE"), nullable=False
    )

    code: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    goal: Mapped[str] = mapped_column(String(255), nullable=False)
    percentage_progress: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    planned_start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    planned_end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    actual_start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    actual_end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    responsible: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    status: Mapped[Optional[StepStatus]] = mapped_column(
        Enum(StepStatus, name="stepstatus", create_type=False),
        nullable=True,
    )

    initiative: Mapped["StrategicInitiative"] = relationship(back_populates="key_results")
    steps: Mapped[List["ActionPlanStep"]] = relationship(
        back_populates="key_result", cascade="all, delete-orphan"
    )