import uuid
from typing import List, Optional

from pydantic import BaseModel, Field


class ProfileCreate(BaseModel):
    # Physique
    first_name: Optional[str] = None
    age: int = Field(..., ge=10, le=100)
    weight_kg: float = Field(..., ge=30, le=300)
    height_cm: float = Field(..., ge=100, le=250)
    gender: str = Field(..., pattern="^(homme|femme|non-binaire)$")

    # Objectif
    goal: str = Field(..., pattern="^(cut|recomp|maintain|bulk)$")
    target_weight_kg: Optional[float] = Field(None, ge=30, le=300)
    target_deadline: Optional[str] = None
    qualitative_goals: List[str] = Field(default=[])

    # Sport
    sport_days: List[int] = Field(default=[], description="0=lundi … 6=dimanche")
    sport_types: List[str] = Field(default=[])
    sport_location: Optional[str] = None
    sport_level: Optional[str] = None

    # Alimentation
    meals_per_day: int = Field(default=3, ge=2, le=6)
    diet_type: str = Field(default="omnivore")
    cooking_time: str = Field(default="normal")
    allergies: List[str] = Field(default=[])
    food_aversions: Optional[str] = None


class ProfileRead(ProfileCreate):
    user_id: uuid.UUID

    model_config = {"from_attributes": True}
