import uuid
from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Date, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.domain.action_plan_step.models import ActionPlanStep


class DelayJustification(Base, TimestampMixin):
    __tablename__ = "delay_justifications"
    __table_args__ = (UniqueConstraint('step_id', name='uq_delay_justification_step'),)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    step_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("action_plan_steps.id", ondelete="CASCADE"), nullable=False
    )
    
    registration_date: Mapped[date] = mapped_column(Date, nullable=False)
    corrective_action: Mapped[str] = mapped_column(Text, nullable=False)
    responsible: Mapped[str] = mapped_column(String(255), nullable=False)
    solution_forecast: Mapped[date] = mapped_column(Date, nullable=False)
    under_arpe_governance: Mapped[bool] = mapped_column(Boolean, nullable=False)
    resolved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    step: Mapped["ActionPlanStep"] = relationship(back_populates="delay_justification")