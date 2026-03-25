import uuid
from datetime import date
from typing import Any, List, Optional

from pydantic import BaseModel


class MealRead(BaseModel):
    meal_id: uuid.UUID
    meal_type: str
    name: str
    ingredients: List[Any]
    calories: Optional[float]
    protein: Optional[float]
    carbs: Optional[float]
    fat: Optional[float]
    prep_time_min: int
    steps: List[Any]
    sauce: Optional[Any]
    plating_tip: Optional[str]

    model_config = {"from_attributes": True}


class DayPlanRead(BaseModel):
    day_id: uuid.UUID
    day_index: int
    is_sport_day: bool
    total_calories: Optional[float]
    total_protein: Optional[float]
    total_carbs: Optional[float]
    total_fat: Optional[float]
    meals: List[MealRead]

    model_config = {"from_attributes": True}


class MealPlanRead(BaseModel):
    plan_id: uuid.UUID
    user_id: uuid.UUID
    week_start: date
    status: str
    days: List[DayPlanRead]

    model_config = {"from_attributes": True}
