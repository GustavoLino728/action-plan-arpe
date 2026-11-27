"""add_import_uploads

Revision ID: 8f325acad7fc
Revises: a08becce4a00
Create Date: 2026-11-25 16:23:21.467052

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '8f325acad7fc'
down_revision: Union[str, Sequence[str], None] = 'a08becce4a00'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    import_mode_enum = postgresql.ENUM(
        "append", "replace", name="import_mode_enum", create_type=False,
    )
    import_mode_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "import_uploads",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("user_name", sa.String(255), nullable=False),
        sa.Column("source_file_name", sa.String(500), nullable=True),
        sa.Column("mode", import_mode_enum, nullable=False),

        # Contadores — espelham exatamente o retorno de services.commit_import
        sa.Column("strategic_perspectives_created", sa.Integer, nullable=False, server_default="0"),
        sa.Column("strategic_objectives_created", sa.Integer, nullable=False, server_default="0"),
        sa.Column("initiatives_created", sa.Integer, nullable=False, server_default="0"),
        sa.Column("key_results_created", sa.Integer, nullable=False, server_default="0"),
        sa.Column("steps_upserted", sa.Integer, nullable=False, server_default="0"),
        sa.Column("steps_deleted", sa.Integer, nullable=False, server_default="0"),
        sa.Column("justificativas_upserted", sa.Integer, nullable=False, server_default="0"),

        # Diagnóstico
        sa.Column("duration_ms", sa.Integer, nullable=True),
        sa.Column("request_id", sa.String(64), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True),
            server_default=sa.text("now()"), nullable=False,
        ),

        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
    )

    op.create_index("ix_import_uploads_user_id", "import_uploads", ["user_id"])
    op.create_index(
        "ix_import_uploads_created_at_desc",
        "import_uploads",
        [sa.text("created_at DESC")],
    )


def downgrade():
    op.drop_index("ix_import_uploads_created_at_desc")
    op.drop_index("ix_import_uploads_user_id")
    op.drop_table("import_uploads")
    postgresql.ENUM(name="import_mode_enum").drop(op.get_bind(), checkfirst=True)