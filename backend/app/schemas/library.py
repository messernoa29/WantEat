import uuid
from datetime import datetime
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
    tiktok_video_id: Optional[str] = None
    creator_handle: Optional[str] = None
    creator_name: Optional[str] = None
    tags: list[str] = []
    likes_count: int = 0
    saves_count: int = 0
    score: Optional[int] = None
    is_saved: bool = False

    model_config = {"from_attributes": True}


class RecipeDetail(RecipeList):
    ingredients: list[dict] = []
    steps: list[dict] = []       # [{text, timer_min?}]
    plating_tip: Optional[str] = None
    subcategory: Optional[RecipeSubcategoryShort] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class RecipeCreate(BaseModel):
    name: str
    description: Optional[str] = None
    subcategory_id: Optional[uuid.UUID] = None
    calories: Optional[float] = None
    protein: Optional[float] = None
    carbs: Optional[float] = None
    fat: Optional[float] = None
    prep_time_min: int = 20
    difficulty: str = "facile"
    ingredients: list[dict] = []
    steps: list[dict] = []
    tiktok_url: Optional[str] = None
    tiktok_video_id: Optional[str] = None
    image_urls: list[str] = []
    creator_handle: Optional[str] = None
    creator_name: Optional[str] = None
    tags: list[str] = []
    plating_tip: Optional[str] = None


class RecipeUpdate(RecipeCreate):
    name: Optional[str] = None
    prep_time_min: Optional[int] = None
    difficulty: Optional[str] = None


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
