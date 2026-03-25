"""sprint1 — profile new fields + water_logs

Revision ID: b1e4f7a2c309
Revises: a3f8c2d91e45
Create Date: 2026-03-25

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'b1e4f7a2c309'
down_revision = 'a3f8c2d91e45'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── user_profiles: new columns ──────────────────────────────
    op.add_column('user_profiles', sa.Column('first_name', sa.String(50), nullable=True))
    op.add_column('user_profiles', sa.Column('target_weight_kg', sa.Float(), nullable=True))
    op.add_column('user_profiles', sa.Column('target_deadline', sa.String(100), nullable=True))
    op.add_column('user_profiles', sa.Column('qualitative_goals', postgresql.JSON(astext_type=sa.Text()), nullable=True, server_default='[]'))
    op.add_column('user_profiles', sa.Column('sport_types', postgresql.JSON(astext_type=sa.Text()), nullable=True, server_default='[]'))
    op.add_column('user_profiles', sa.Column('sport_location', sa.String(50), nullable=True))
    op.add_column('user_profiles', sa.Column('sport_level', sa.String(20), nullable=True))
    op.add_column('user_profiles', sa.Column('allergies', postgresql.JSON(astext_type=sa.Text()), nullable=True, server_default='[]'))
    op.add_column('user_profiles', sa.Column('food_aversions', sa.Text(), nullable=True))

    # gender column may need to grow for "non-binaire"
    op.alter_column('user_profiles', 'gender', type_=sa.String(20))

    # ── water_logs table ────────────────────────────────────────
    op.create_table(
        'water_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('total_ml', sa.Integer(), nullable=False, server_default='0'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'date', name='uq_water_user_date'),
    )
    op.create_index('ix_water_logs_user_id', 'water_logs', ['user_id'])


def downgrade() -> None:
    op.drop_table('water_logs')
    for col in ['first_name', 'target_weight_kg', 'target_deadline', 'qualitative_goals',
                'sport_types', 'sport_location', 'sport_level', 'allergies', 'food_aversions']:
        op.drop_column('user_profiles', col)
