"""add library

Revision ID: a3f8c2d91e45
Revises: 361a65dd6b8b
Create Date: 2026-03-25

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'a3f8c2d91e45'
down_revision = '361a65dd6b8b'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'recipe_categories',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('slug', sa.String(50), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('emoji', sa.String(10), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('order', sa.Integer(), nullable=False, server_default='0'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('slug'),
    )

    op.create_table(
        'recipe_subcategories',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('category_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('slug', sa.String(50), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('emoji', sa.String(10), nullable=False),
        sa.Column('order', sa.Integer(), nullable=False, server_default='0'),
        sa.ForeignKeyConstraint(['category_id'], ['recipe_categories.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('slug'),
    )

    op.create_table(
        'recipes',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('subcategory_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('calories', sa.Float(), nullable=True),
        sa.Column('protein', sa.Float(), nullable=True),
        sa.Column('carbs', sa.Float(), nullable=True),
        sa.Column('fat', sa.Float(), nullable=True),
        sa.Column('prep_time_min', sa.Integer(), nullable=False, server_default='20'),
        sa.Column('difficulty', sa.String(20), nullable=False, server_default='facile'),
        sa.Column('ingredients', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('steps', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('tiktok_url', sa.String(500), nullable=True),
        sa.Column('image_urls', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(['subcategory_id'], ['recipe_subcategories.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table(
        'weekly_slots',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('week_start', sa.Date(), nullable=False),
        sa.Column('day_index', sa.Integer(), nullable=False),
        sa.Column('meal_type', sa.String(30), nullable=False),
        sa.Column('recipe_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(['recipe_id'], ['recipes.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_weekly_slots_user_id', 'weekly_slots', ['user_id'])


def downgrade() -> None:
    op.drop_table('weekly_slots')
    op.drop_table('recipes')
    op.drop_table('recipe_subcategories')
    op.drop_table('recipe_categories')
