"""drop legacy sector columns

Revision ID: <hash>
Revises: 41d3fa93664d
Create Date: 2026-11-19

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a08becce4a00'
down_revision: Union[str, Sequence[str], None] = '41d3fa93664d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column('strategic_initiatives', 'responsible_sector')
    op.drop_column('users', 'department')


def downgrade() -> None:
    op.add_column('strategic_initiatives', sa.Column('responsible_sector', sa.String(255), nullable=True))
    op.add_column('users', sa.Column('department', sa.String(255), nullable=True))