import uuid
from datetime import date
from typing import Optional

from pydantic import BaseModel


class MealLogCreate(BaseModel):
    date: date
    meal_id: Optional[uuid.UUID] = None
    calories_consumed: float
    protein_consumed: float
    carbs_consumed: float
    fat_consumed: float


class MealLogRead(MealLogCreate):
    log_id: uuid.UUID
    user_id: uuid.UUID

    model_config = {"from_attributes": True}


class TrackerToday(BaseModel):
    date: date
    calories_target: float
    protein_target: float
    carbs_target: float
    fat_target: float
    calories_consumed: float
    protein_consumed: float
    carbs_consumed: float
    fat_consumed: float


class TrackerWeek(BaseModel):
    adherence_rate: float  # 0-100%
    streak_days: int
    days: list
