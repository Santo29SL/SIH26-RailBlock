"""add_movement_type_to_train_movements

Revision ID: 8b9c0d1e2f3a
Revises: 7a8f9c1b2d3e
Create Date: 2026-08-29 02:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8b9c0d1e2f3a'
down_revision: Union[str, None] = '7a8f9c1b2d3e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'train_movements',
        sa.Column('movement_type', sa.String(length=30), nullable=False, server_default='SCHEDULED')
    )


def downgrade() -> None:
    op.drop_column('train_movements', 'movement_type')
