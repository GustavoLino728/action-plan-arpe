"""add updated_at to import_uploads

Revision ID: a6d6295c64c4
Revises: 8f325acad7fc
Create Date: 2026-11-27 12:13:54.013001

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a6d6295c64c4'
down_revision: Union[str, Sequence[str], None] = '8f325acad7fc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.add_column(
        "import_uploads",
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )


def downgrade():
    op.drop_column("import_uploads", "updated_at")