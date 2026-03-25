from datetime import date

from fastapi import APIRouter
from sqlalchemy import func, select

from app.db.models.meal_plan import MealLog
from app.dependencies import CurrentUserDep, DBDep
from app.schemas.macros import MacrosRead
from app.schemas.tracker import MealLogCreate, MealLogRead, TrackerToday
from app.db.models.user import UserProfile
from app.services.macros_service import calculate_macros

router = APIRouter(prefix="/tracker", tags=["tracker"])


@router.post("/log", response_model=MealLogRead, status_code=201)
async def log_meal(data: MealLogCreate, user_id: CurrentUserDep, db: DBDep) -> MealLog:
    log = MealLog(user_id=user_id, **data.model_dump())
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log


@router.get("/today", response_model=TrackerToday)
async def get_today(user_id: CurrentUserDep, db: DBDep) -> TrackerToday:
    today = date.today()

    profile_result = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = profile_result.scalar_one_or_none()
    macros = calculate_macros(profile) if profile else MacrosRead(
        calories=2000, protein_g=150, carbs_g=200, fat_g=65, bmr=1700, tdee=2000
    )

    logs_result = await db.execute(
        select(
            func.coalesce(func.sum(MealLog.calories_consumed), 0),
            func.coalesce(func.sum(MealLog.protein_consumed), 0),
            func.coalesce(func.sum(MealLog.carbs_consumed), 0),
            func.coalesce(func.sum(MealLog.fat_consumed), 0),
        ).where(MealLog.user_id == user_id, MealLog.date == today)
    )
    cal, prot, carbs, fat = logs_result.one()

    return TrackerToday(
        date=today,
        calories_target=macros.calories,
        protein_target=macros.protein_g,
        carbs_target=macros.carbs_g,
        fat_target=macros.fat_g,
        calories_consumed=float(cal),
        protein_consumed=float(prot),
        carbs_consumed=float(carbs),
        fat_consumed=float(fat),
    )
