import uuid
from typing import Optional

from fastapi import APIRouter, Query
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.exceptions import NotFoundError
from app.db.models.library import Recipe, RecipeCategory, RecipeSubcategory
from app.db.models.user import UserProfile
from app.dependencies import CurrentUserDep, DBDep
from app.schemas.library import RecipeCategoryRead, RecipeDetail, RecipeList
from app.services.macros_service import calculate_macros
from app.services.score_service import calculate_recipe_score

router = APIRouter(prefix="/library", tags=["library"])


async def _get_macros(user_id: uuid.UUID, db):
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = result.scalar_one_or_none()
    if not profile:
        return None, 3
    return calculate_macros(profile), profile.meals_per_day or 3


@router.get("/categories", response_model=list[RecipeCategoryRead])
async def get_categories(db: DBDep):
    result = await db.execute(
        select(RecipeCategory)
        .options(selectinload(RecipeCategory.subcategories))
        .order_by(RecipeCategory.order)
    )
    return result.scalars().all()


@router.get("/recipes", response_model=list[RecipeList])
async def get_recipes(
    user_id: CurrentUserDep,
    db: DBDep,
    subcategory_id: Optional[uuid.UUID] = Query(None),
    category_id: Optional[uuid.UUID] = Query(None),
):
    q = select(Recipe)
    if subcategory_id:
        q = q.where(Recipe.subcategory_id == subcategory_id)
    elif category_id:
        q = q.join(RecipeSubcategory).where(RecipeSubcategory.category_id == category_id)
    result = await db.execute(q.order_by(Recipe.name))
    recipes = result.scalars().all()

    macros, meals_per_day = await _get_macros(user_id, db)
    out = []
    for r in recipes:
        item = RecipeList.model_validate(r)
        if macros:
            item.score = calculate_recipe_score(
                r.calories or 0, r.protein or 0, r.fat or 0, macros, meals_per_day
            )
        out.append(item)
    return out


@router.get("/recipes/{recipe_id}", response_model=RecipeDetail)
async def get_recipe(recipe_id: uuid.UUID, user_id: CurrentUserDep, db: DBDep):
    result = await db.execute(
        select(Recipe)
        .where(Recipe.id == recipe_id)
        .options(selectinload(Recipe.subcategory))
    )
    recipe = result.scalar_one_or_none()
    if not recipe:
        raise NotFoundError("Recette introuvable")

    macros, meals_per_day = await _get_macros(user_id, db)
    item = RecipeDetail.model_validate(recipe)
    if macros:
        item.score = calculate_recipe_score(
            recipe.calories or 0, recipe.protein or 0, recipe.fat or 0, macros, meals_per_day
        )
    return item
