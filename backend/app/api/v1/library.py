import uuid
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.core.exceptions import NotFoundError
from app.db.models.library import Recipe, RecipeCategory, RecipeSubcategory, RecipeSave
from app.db.models.user import UserProfile
from app.dependencies import CurrentUserDep, DBDep, OptionalUserDep
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


async def _saved_ids(user_id: uuid.UUID, db) -> set[uuid.UUID]:
    result = await db.execute(
        select(RecipeSave.recipe_id).where(RecipeSave.user_id == user_id)
    )
    return set(result.scalars().all())


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
    user_id: OptionalUserDep,
    db: DBDep,
    subcategory_id: Optional[uuid.UUID] = Query(None),
    category_id: Optional[uuid.UUID] = Query(None),
    tags: Optional[str] = Query(None),              # comma-separated
    kcal_max: Optional[float] = Query(None),
    prot_min: Optional[float] = Query(None),
    prep_max: Optional[int] = Query(None),
    creator: Optional[str] = Query(None),
    sort: Optional[str] = Query("name"),             # name | likes | recent | random
    saved_only: bool = Query(False),
):
    q = select(Recipe)

    if subcategory_id:
        q = q.where(Recipe.subcategory_id == subcategory_id)
    elif category_id:
        q = q.join(RecipeSubcategory).where(RecipeSubcategory.category_id == category_id)

    if tags:
        for tag in tags.split(","):
            q = q.where(Recipe.tags.any(tag.strip()))
    if kcal_max:
        q = q.where(Recipe.calories <= kcal_max)
    if prot_min:
        q = q.where(Recipe.protein >= prot_min)
    if prep_max:
        q = q.where(Recipe.prep_time_min <= prep_max)
    if creator:
        q = q.where(Recipe.creator_handle.ilike(f"%{creator}%"))
    if saved_only:
        q = q.join(RecipeSave, (RecipeSave.recipe_id == Recipe.id) & (RecipeSave.user_id == user_id))

    if sort == "likes":
        q = q.order_by(Recipe.likes_count.desc())
    elif sort == "recent":
        q = q.order_by(Recipe.created_at.desc())
    elif sort == "random":
        q = q.order_by(func.random())
    else:
        q = q.order_by(Recipe.name)

    result = await db.execute(q)
    recipes = result.scalars().all()

    macros, meals_per_day = (None, 3)
    saved: set = set()
    if user_id:
        macros, meals_per_day = await _get_macros(user_id, db)
        saved = await _saved_ids(user_id, db)

    out = []
    for r in recipes:
        item = RecipeList.model_validate(r)
        item.is_saved = r.id in saved
        if macros:
            item.score = calculate_recipe_score(
                r.calories or 0, r.protein or 0, r.fat or 0, macros, meals_per_day
            )
        out.append(item)
    return out


@router.get("/recipes/{recipe_id}", response_model=RecipeDetail)
async def get_recipe(recipe_id: uuid.UUID, user_id: OptionalUserDep, db: DBDep):
    result = await db.execute(
        select(Recipe)
        .where(Recipe.id == recipe_id)
        .options(selectinload(Recipe.subcategory))
    )
    recipe = result.scalar_one_or_none()
    if not recipe:
        raise NotFoundError("Recette introuvable")

    macros, meals_per_day = (None, 3)
    saved: set = set()
    if user_id:
        macros, meals_per_day = await _get_macros(user_id, db)
        saved = await _saved_ids(user_id, db)

    item = RecipeDetail.model_validate(recipe)
    item.is_saved = recipe.id in saved
    if macros:
        item.score = calculate_recipe_score(
            recipe.calories or 0, recipe.protein or 0, recipe.fat or 0, macros, meals_per_day
        )
    return item


@router.post("/recipes/{recipe_id}/save", status_code=201)
async def save_recipe(recipe_id: uuid.UUID, user_id: CurrentUserDep, db: DBDep):
    exists = await db.execute(
        select(RecipeSave).where(
            RecipeSave.user_id == user_id, RecipeSave.recipe_id == recipe_id
        )
    )
    if exists.scalar_one_or_none():
        return {"saved": True}

    db.add(RecipeSave(user_id=user_id, recipe_id=recipe_id))
    # increment counter
    await db.execute(
        Recipe.__table__.update()
        .where(Recipe.id == recipe_id)
        .values(saves_count=Recipe.saves_count + 1)
    )
    await db.commit()
    return {"saved": True}


@router.delete("/recipes/{recipe_id}/save", status_code=200)
async def unsave_recipe(recipe_id: uuid.UUID, user_id: CurrentUserDep, db: DBDep):
    result = await db.execute(
        select(RecipeSave).where(
            RecipeSave.user_id == user_id, RecipeSave.recipe_id == recipe_id
        )
    )
    row = result.scalar_one_or_none()
    if row:
        await db.delete(row)
        await db.execute(
            Recipe.__table__.update()
            .where(Recipe.id == recipe_id)
            .values(saves_count=func.greatest(Recipe.saves_count - 1, 0))
        )
        await db.commit()
    return {"saved": False}
