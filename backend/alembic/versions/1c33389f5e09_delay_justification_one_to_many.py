"""delay_justification_one_to_many

Revision ID: <hash>
Revises: <hash-anterior>
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'xyz789uvw012'
down_revision: Union[str, None] = '56dbdbc46bfa'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Remove a constraint de unicidade que forçava 1:1
    op.drop_constraint(
        'uq_delay_justification_step',
        'delay_justifications',
        type_='unique',
    )


def downgrade() -> None:
    # Recriar a constraint (só funciona se não houver duplicatas)
    op.create_unique_constraint(
        'uq_delay_justification_step',
        'delay_justifications',
        ['step_id'],
    )