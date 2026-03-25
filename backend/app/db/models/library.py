import uuid
from typing import Any

from sqlalchemy import JSON, Boolean, Date, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class RecipeCategory(Base):
    __tablename__ = "recipe_categories"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    emoji: Mapped[str] = mapped_column(String(10), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    order: Mapped[int] = mapped_column(Integer, default=0)

    subcategories: Mapped[list["RecipeSubcategory"]] = relationship(
        "RecipeSubcategory",
        back_populates="category",
        order_by="RecipeSubcategory.order",
        cascade="all, delete-orphan",
    )


class RecipeSubcategory(Base):
    __tablename__ = "recipe_subcategories"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("recipe_categories.id", ondelete="CASCADE"), nullable=False
    )
    slug: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    emoji: Mapped[str] = mapped_column(String(10), nullable=False)
    order: Mapped[int] = mapped_column(Integer, default=0)

    category: Mapped["RecipeCategory"] = relationship("RecipeCategory", back_populates="subcategories")
    recipes: Mapped[list["Recipe"]] = relationship("Recipe", back_populates="subcategory")


class Recipe(Base):
    __tablename__ = "recipes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subcategory_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("recipe_subcategories.id", ondelete="SET NULL"), nullable=True
    )

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)

    calories: Mapped[float] = mapped_column(Float, nullable=True)
    protein: Mapped[float] = mapped_column(Float, nullable=True)
    carbs: Mapped[float] = mapped_column(Float, nullable=True)
    fat: Mapped[float] = mapped_column(Float, nullable=True)

    prep_time_min: Mapped[int] = mapped_column(Integer, default=20)
    difficulty: Mapped[str] = mapped_column(String(20), default="facile")  # facile, moyen, difficile

    ingredients: Mapped[Any] = mapped_column(JSON, default=list)   # [{name, quantity_g, unit}]
    steps: Mapped[Any] = mapped_column(JSON, default=list)          # [str]

    tiktok_url: Mapped[str] = mapped_column(String(500), nullable=True)
    image_urls: Mapped[Any] = mapped_column(JSON, default=list)     # [str]

    subcategory: Mapped["RecipeSubcategory"] = relationship("RecipeSubcategory", back_populates="recipes")
    weekly_slots: Mapped[list["WeeklySlot"]] = relationship("WeeklySlot", back_populates="recipe")


class WeeklySlot(Base):
    __tablename__ = "weekly_slots"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    week_start: Mapped[Any] = mapped_column(Date, nullable=False)
    day_index: Mapped[int] = mapped_column(Integer, nullable=False)  # 0=Lundi … 6=Dimanche
    meal_type: Mapped[str] = mapped_column(String(30), nullable=False)  # déjeuner, dîner, etc.
    recipe_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("recipes.id", ondelete="SET NULL"), nullable=True
    )

    recipe: Mapped["Recipe"] = relationship("Recipe", back_populates="weekly_slots")
