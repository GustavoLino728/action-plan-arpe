"""add_department_id_to_users_and_initiatives

Revision ID: 41d3fa93664d
Revises: 282ff4f7c634
Create Date: 2026-11-18 14:18:33.998150

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '41d3fa93664d'
down_revision: Union[str, Sequence[str], None] = '282ff4f7c634'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # strategic_initiatives: nova coluna + FK
    op.add_column('strategic_initiatives', sa.Column('department_id', sa.UUID(), nullable=True))
    op.create_index(op.f('ix_strategic_initiatives_department_id'), 'strategic_initiatives', ['department_id'], unique=False)
    op.create_foreign_key('fk_strategic_initiatives_department_id', 'strategic_initiatives', 'departments', ['department_id'], ['id'], ondelete='SET NULL')

    # users: nova coluna + FK
    op.add_column('users', sa.Column('department_id', sa.UUID(), nullable=True))
    op.create_index(op.f('ix_users_department_id'), 'users', ['department_id'], unique=False)
    op.create_foreign_key('fk_users_department_id', 'users', 'departments', ['department_id'], ['id'], ondelete='SET NULL')

    # Drop colunas legadas (dados já foram limpos antes desta migration)
    op.drop_column('users', 'department')
    op.drop_column('strategic_initiatives', 'responsible_sector')


def downgrade() -> None:
    # Recriar colunas legadas (nullable para não quebrar)
    op.add_column('users', sa.Column('department', sa.String(255), nullable=True))
    op.add_column('strategic_initiatives', sa.Column('responsible_sector', sa.String(255), nullable=True))

    op.drop_constraint('fk_users_department_id', 'users', type_='foreignkey')
    op.drop_index(op.f('ix_users_department_id'), table_name='users')
    op.drop_column('users', 'department_id')

    op.drop_constraint('fk_strategic_initiatives_department_id', 'strategic_initiatives', type_='foreignkey')
    op.drop_index(op.f('ix_strategic_initiatives_department_id'), table_name='strategic_initiatives')
    op.drop_column('strategic_initiatives', 'department_id')