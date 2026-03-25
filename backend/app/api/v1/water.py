from datetime import date, timedelta

from fastapi import APIRouter
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

from app.db.models.user import UserProfile
from app.db.models.water import WaterLog
from app.dependencies import CurrentUserDep, DBDep
from app.services.macros_service import calculate_macros
from pydantic import BaseModel

router = APIRouter(prefix="/water", tags=["water"])


class WaterToday(BaseModel):
    date: date
    consumed_ml: int
    goal_ml: int
    pct: int


class WaterAdd(BaseModel):
    amount_ml: int = 250


def _is_sport_day(sport_days: list[int]) -> bool:
    today = date.today().weekday()  # 0=Monday
    return today in (sport_days or [])


@router.get("/today", response_model=WaterToday)
async def get_water_today(user_id: CurrentUserDep, db: DBDep):
    today = date.today()

    result = await db.execute(
        select(WaterLog).where(WaterLog.user_id == user_id, WaterLog.date == today)
    )
    log = result.scalar_one_or_none()
    consumed = log.total_ml if log else 0

    # Goal from macros
    profile_res = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = profile_res.scalar_one_or_none()

    if profile:
        macros = calculate_macros(profile)
        goal = macros.water_goal_ml
        if _is_sport_day(profile.sport_days or []):
            goal += 500
    else:
        goal = 2500

    pct = min(100, round(consumed / goal * 100)) if goal else 0
    return WaterToday(date=today, consumed_ml=consumed, goal_ml=goal, pct=pct)


@router.post("/add", response_model=WaterToday)
async def add_water(user_id: CurrentUserDep, db: DBDep, body: WaterAdd):
    today = date.today()

    # Upsert: create or increment
    stmt = (
        insert(WaterLog)
        .values(user_id=user_id, date=today, total_ml=body.amount_ml)
        .on_conflict_do_update(
            constraint="uq_water_user_date",
            set_={"total_ml": WaterLog.total_ml + body.amount_ml},
        )
    )
    await db.execute(stmt)
    await db.commit()

    return await get_water_today(user_id, db)


@router.delete("/reset", status_code=204)
async def reset_water(user_id: CurrentUserDep, db: DBDep):
    result = await db.execute(
        select(WaterLog).where(WaterLog.user_id == user_id, WaterLog.date == date.today())
    )
    log = result.scalar_one_or_none()
    if log:
        await db.delete(log)
        await db.commit()
