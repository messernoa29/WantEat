import uuid
from typing import Any

from sqlalchemy import JSON, Boolean, Date, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class MealPlan(Base):
    __tablename__ = "meal_plans"

    plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    week_start: Mapped[Any] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending / ready / failed

    days: Mapped[list["DayPlan"]] = relationship(
        "DayPlan", back_populates="plan", cascade="all, delete-orphan"
    )


class DayPlan(Base):
    __tablename__ = "day_plans"

    day_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("meal_plans.plan_id", ondelete="CASCADE"), nullable=False
    )
    day_index: Mapped[int] = mapped_column(Integer, nullable=False)  # 0=lundi … 6=dimanche
    is_sport_day: Mapped[bool] = mapped_column(Boolean, default=False)
    total_calories: Mapped[float] = mapped_column(nullable=True)
    total_protein: Mapped[float] = mapped_column(nullable=True)
    total_carbs: Mapped[float] = mapped_column(nullable=True)
    total_fat: Mapped[float] = mapped_column(nullable=True)

    plan: Mapped["MealPlan"] = relationship("MealPlan", back_populates="days")
    meals: Mapped[list["Meal"]] = relationship(
        "Meal", back_populates="day", cascade="all, delete-orphan"
    )


class Meal(Base):
    __tablename__ = "meals"

    meal_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    day_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("day_plans.day_id", ondelete="CASCADE"), nullable=False
    )
    meal_type: Mapped[str] = mapped_column(String(30), nullable=False)  # déjeuner, dîner, etc.
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    ingredients: Mapped[Any] = mapped_column(JSON, default=list)   # [{name, quantity_g, ...}]
    calories: Mapped[float] = mapped_column(nullable=True)
    protein: Mapped[float] = mapped_column(nullable=True)
    carbs: Mapped[float] = mapped_column(nullable=True)
    fat: Mapped[float] = mapped_column(nullable=True)
    prep_time_min: Mapped[int] = mapped_column(Integer, default=20)
    steps: Mapped[Any] = mapped_column(JSON, default=list)
    sauce: Mapped[Any] = mapped_column(JSON, nullable=True)         # {name, ingredients, kcal}
    plating_tip: Mapped[str] = mapped_column(String(500), nullable=True)

    day: Mapped["DayPlan"] = relationship("DayPlan", back_populates="meals")


class MealLog(Base):
    __tablename__ = "meal_logs"

    log_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    date: Mapped[Any] = mapped_column(Date, nullable=False)
    meal_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("meals.meal_id", ondelete="SET NULL"), nullable=True
    )
    calories_consumed: Mapped[float] = mapped_column(nullable=True)
    protein_consumed: Mapped[float] = mapped_column(nullable=True)
    carbs_consumed: Mapped[float] = mapped_column(nullable=True)
    fat_consumed: Mapped[float] = mapped_column(nullable=True)
