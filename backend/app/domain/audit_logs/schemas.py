from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class AuditLogRead(BaseModel):
    id: UUID
    entity_type: str
    entity_id: UUID
    action: str
    user_id: UUID | None = None
    user_name: str | None = None
    changes: dict[str, Any] | None = None
    message: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)