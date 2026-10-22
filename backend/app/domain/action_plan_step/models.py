import enum
import uuid
from datetime import date
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Date, Enum, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.domain.key_result.models import KeyResult
    from app.domain.delay_justification.models import DelayJustification


class StepStatus(str, enum.Enum):
    NOT_STARTED = "Not Started"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"
    DELAYED = "Delayed"


class ActionPlanStep(Base, TimestampMixin):
    __tablename__ = "action_plan_steps"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    key_result_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("key_results.id", ondelete="CASCADE"), nullable=False
    )

    sequential_number: Mapped[int] = mapped_column(Integer, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    planned_start_date: Mapped[date] = mapped_column(Date, nullable=False)
    planned_end_date: Mapped[date] = mapped_column(Date, nullable=False)
    actual_start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    actual_end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    responsible: Mapped[str] = mapped_column(String(255), nullable=False)
    
    status: Mapped[StepStatus] = mapped_column(
        Enum(StepStatus, name="stepstatus"),
        default=StepStatus.NOT_STARTED,
        nullable=False,
    )

    key_result: Mapped["KeyResult"] = relationship(back_populates="steps")

    delay_justification: Mapped[Optional["DelayJustification"]] = relationship(
        back_populates="step", uselist=False, cascade="all, delete-orphan"
    )