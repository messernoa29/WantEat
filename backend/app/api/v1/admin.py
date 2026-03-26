"""Admin router — accès protégé par rôle ADMIN dans Supabase app_metadata."""
import csv
import io
import uuid
from datetime import date, timedelta
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import func, select

from app.core.security import decode_supabase_jwt
from app.db.models.library import Recipe, RecipeSave
from app.db.models.meal_plan import MealLog
from app.db.models.user import UserProfile
from app.dependencies import DBDep
from app.schemas.library import RecipeCreate, RecipeDetail, RecipeList, RecipeUpdate

router = APIRouter(prefix="/admin", tags=["admin"])
bearer_scheme = HTTPBearer()


async def get_admin_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
) -> dict:
    payload = await decode_supabase_jwt(credentials.credentials)
    role = (payload.get("app_metadata") or {}).get("role") or \
           (payload.get("user_metadata") or {}).get("role")
    if role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only")
    return payload


AdminDep = Annotated[dict, Depends(get_admin_user)]


# ── STATS / KPIs ─────────────────────────────────────────────────────────────

@router.get("/stats")
async def get_stats(admin: AdminDep, db: DBDep):
    today = date.today()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)

    # Total users
    total_users = (await db.execute(select(func.count(UserProfile.user_id)))).scalar() or 0

    # Active users 7j (users who logged at least once)
    active_7d = (await db.execute(
        select(func.count(func.distinct(MealLog.user_id)))
        .where(MealLog.date >= week_ago)
    )).scalar() or 0

    # Goal distribution
    goal_rows = (await db.execute(
        select(UserProfile.goal, func.count(UserProfile.user_id))
        .group_by(UserProfile.goal)
    )).all()
    goal_dist = {row[0]: row[1] for row in goal_rows if row[0]}

    # Average age
    avg_age = (await db.execute(select(func.avg(UserProfile.age)))).scalar()
    avg_age = round(avg_age, 1) if avg_age else None

    # Age buckets
    age_rows = (await db.execute(select(UserProfile.age).where(UserProfile.age.isnot(None)))).scalars().all()
    age_buckets: dict[str, int] = {}
    for age in age_rows:
        if age < 20: bucket = "<20"
        elif age < 30: bucket = "20-29"
        elif age < 40: bucket = "30-39"
        elif age < 50: bucket = "40-49"
        else: bucket = "50+"
        age_buckets[bucket] = age_buckets.get(bucket, 0) + 1

    # Top 10 saved recipes this week
    top_saves = (await db.execute(
        select(Recipe.id, Recipe.name, func.count(RecipeSave.id).label("cnt"))
        .join(RecipeSave, RecipeSave.recipe_id == Recipe.id)
        .where(RecipeSave.saved_at >= week_ago)
        .group_by(Recipe.id, Recipe.name)
        .order_by(func.count(RecipeSave.id).desc())
        .limit(10)
    )).all()
    top_recipes = [{"id": str(r.id), "name": r.name, "saves": r.cnt} for r in top_saves]

    # Retention J1 / J7 / J30 (rough: % users who logged after N days from first log)
    # Simplified: count unique users who logged in last 1/7/30 days vs total
    active_1d = (await db.execute(
        select(func.count(func.distinct(MealLog.user_id)))
        .where(MealLog.date >= today - timedelta(days=1))
    )).scalar() or 0
    active_30d = (await db.execute(
        select(func.count(func.distinct(MealLog.user_id)))
        .where(MealLog.date >= month_ago)
    )).scalar() or 0

    retention = {
        "j1": round(active_1d / total_users * 100, 1) if total_users else 0,
        "j7": round(active_7d / total_users * 100, 1) if total_users else 0,
        "j30": round(active_30d / total_users * 100, 1) if total_users else 0,
    }

    return {
        "total_users": total_users,
        "active_7d": active_7d,
        "goal_distribution": goal_dist,
        "avg_age": avg_age,
        "age_buckets": age_buckets,
        "top_recipes_this_week": top_recipes,
        "retention": retention,
    }


# ── RECIPE CRUD ───────────────────────────────────────────────────────────────

@router.get("/recipes", response_model=list[RecipeList])
async def admin_list_recipes(
    admin: AdminDep,
    db: DBDep,
    search: Optional[str] = Query(None),
    limit: int = Query(50),
    offset: int = Query(0),
):
    q = select(Recipe).order_by(Recipe.created_at.desc()).limit(limit).offset(offset)
    if search:
        q = q.where(Recipe.name.ilike(f"%{search}%"))
    result = await db.execute(q)
    return result.scalars().all()


@router.post("/recipes", response_model=RecipeDetail, status_code=201)
async def admin_create_recipe(data: RecipeCreate, admin: AdminDep, db: DBDep):
    recipe = Recipe(**data.model_dump())
    db.add(recipe)
    await db.commit()
    await db.refresh(recipe)
    return recipe


@router.get("/recipes/{recipe_id}", response_model=RecipeDetail)
async def admin_get_recipe(recipe_id: uuid.UUID, admin: AdminDep, db: DBDep):
    result = await db.execute(select(Recipe).where(Recipe.id == recipe_id))
    recipe = result.scalar_one_or_none()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recette introuvable")
    return recipe


@router.put("/recipes/{recipe_id}", response_model=RecipeDetail)
async def admin_update_recipe(recipe_id: uuid.UUID, data: RecipeUpdate, admin: AdminDep, db: DBDep):
    result = await db.execute(select(Recipe).where(Recipe.id == recipe_id))
    recipe = result.scalar_one_or_none()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recette introuvable")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(recipe, k, v)
    await db.commit()
    await db.refresh(recipe)
    return recipe


@router.delete("/recipes/{recipe_id}", status_code=204)
async def admin_delete_recipe(recipe_id: uuid.UUID, admin: AdminDep, db: DBDep):
    result = await db.execute(select(Recipe).where(Recipe.id == recipe_id))
    recipe = result.scalar_one_or_none()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recette introuvable")
    await db.delete(recipe)
    await db.commit()


# ── USERS ─────────────────────────────────────────────────────────────────────

@router.get("/users")
async def admin_list_users(
    admin: AdminDep,
    db: DBDep,
    limit: int = Query(50),
    offset: int = Query(0),
):
    result = await db.execute(
        select(UserProfile).order_by(UserProfile.user_id).limit(limit).offset(offset)
    )
    users = result.scalars().all()
    return [
        {
            "user_id": str(u.user_id),
            "first_name": u.first_name,
            "age": u.age,
            "weight_kg": u.weight_kg,
            "height_cm": u.height_cm,
            "gender": u.gender,
            "goal": u.goal,
            "diet_type": u.diet_type,
            "sport_days": u.sport_days,
            "meals_per_day": u.meals_per_day,
        }
        for u in users
    ]


@router.get("/users/export")
async def admin_export_users(admin: AdminDep, db: DBDep):
    result = await db.execute(select(UserProfile).order_by(UserProfile.user_id))
    users = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["user_id", "first_name", "age", "weight_kg", "height_cm", "gender", "goal", "diet_type"])
    for u in users:
        writer.writerow([u.user_id, u.first_name, u.age, u.weight_kg, u.height_cm, u.gender, u.goal, u.diet_type])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=users.csv"},
    )
