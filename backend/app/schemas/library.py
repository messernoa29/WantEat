import uuid
from typing import Optional

from pydantic import BaseModel


class RecipeSubcategoryShort(BaseModel):
    id: uuid.UUID
    slug: str
    name: str
    emoji: str

    model_config = {"from_attributes": True}


class RecipeCategoryRead(BaseModel):
    id: uuid.UUID
    slug: str
    name: str
    emoji: str
    description: Optional[str] = None
    order: int
    subcategories: list[RecipeSubcategoryShort]

    model_config = {"from_attributes": True}


class RecipeList(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    calories: Optional[float] = None
    protein: Optional[float] = None
    carbs: Optional[float] = None
    fat: Optional[float] = None
    prep_time_min: int
    difficulty: str
    image_urls: list[str] = []
    tiktok_url: Optional[str] = None
    score: Optional[int] = None

    model_config = {"from_attributes": True}


class RecipeDetail(RecipeList):
    ingredients: list[dict] = []
    steps: list[str] = []
    subcategory: Optional[RecipeSubcategoryShort] = None

    model_config = {"from_attributes": True}


class WeeklySlotCreate(BaseModel):
    day_index: int
    meal_type: str
    recipe_id: uuid.UUID


class WeeklySlotRead(BaseModel):
    id: uuid.UUID
    day_index: int
    meal_type: str
    recipe: Optional[RecipeList] = None

    model_config = {"from_attributes": True}
