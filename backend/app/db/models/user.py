import uuid
from typing import Any

from sqlalchemy import ARRAY, Float, Integer, JSON, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # ── Profil physique ──────────────────────────────────────────
    first_name: Mapped[str] = mapped_column(String(50), nullable=True)
    age: Mapped[int] = mapped_column(Integer, nullable=False)
    weight_kg: Mapped[float] = mapped_column(nullable=False)
    height_cm: Mapped[float] = mapped_column(nullable=False)
    gender: Mapped[str] = mapped_column(String(20), nullable=False)  # homme / femme / non-binaire

    # ── Objectif ────────────────────────────────────────────────
    goal: Mapped[str] = mapped_column(String(20), nullable=False)    # cut / recomp / maintain / bulk
    target_weight_kg: Mapped[float] = mapped_column(Float, nullable=True)
    target_deadline: Mapped[str] = mapped_column(String(100), nullable=True)  # texte libre
    qualitative_goals: Mapped[Any] = mapped_column(JSON, default=list)  # ["perdre du gras", …]

    # ── Sport ───────────────────────────────────────────────────
    sport_days: Mapped[list[int]] = mapped_column(ARRAY(Integer), default=list)  # 0=lun…6=dim
    sport_types: Mapped[Any] = mapped_column(JSON, default=list)     # ["musculation", "running", …]
    sport_location: Mapped[str] = mapped_column(String(50), nullable=True)  # salle/maison/plein air
    sport_level: Mapped[str] = mapped_column(String(20), nullable=True)     # débutant/intermédiaire/avancé

    # ── Alimentation ────────────────────────────────────────────
    meals_per_day: Mapped[int] = mapped_column(Integer, default=3)
    diet_type: Mapped[str] = mapped_column(String(20), default="omnivore")
    cooking_time: Mapped[str] = mapped_column(String(20), default="normal")
    allergies: Mapped[Any] = mapped_column(JSON, default=list)       # ["lactose", "gluten", …]
    food_aversions: Mapped[str] = mapped_column(Text, nullable=True)  # texte libre
