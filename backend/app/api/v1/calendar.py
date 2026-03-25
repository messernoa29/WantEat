import uuid
from datetime import date, timedelta

from fastapi import APIRouter
from sqlalchemy import delete, select
from sqlalchemy.orm import selectinload

from app.db.models.library import WeeklySlot
from app.dependencies import CurrentUserDep, DBDep
from app.schemas.library import WeeklySlotCreate, WeeklySlotRead

router = APIRouter(prefix="/calendar", tags=["calendar"])


def get_week_start() -> date:
    today = date.today()
    return today - timedelta(days=today.weekday())


@router.get("/slots", response_model=list[WeeklySlotRead])
async def get_slots(user_id: CurrentUserDep, db: DBDep):
    result = await db.execute(
        select(WeeklySlot)
        .where(WeeklySlot.user_id == user_id, WeeklySlot.week_start == get_week_start())
        .options(selectinload(WeeklySlot.recipe))
        .order_by(WeeklySlot.day_index)
    )
    return result.scalars().all()


@router.post("/slots", response_model=WeeklySlotRead, status_code=201)
async def add_slot(user_id: CurrentUserDep, db: DBDep, body: WeeklySlotCreate):
    # Upsert: same day + meal_type → replace
    await db.execute(
        delete(WeeklySlot).where(
            WeeklySlot.user_id == user_id,
            WeeklySlot.week_start == get_week_start(),
            WeeklySlot.day_index == body.day_index,
            WeeklySlot.meal_type == body.meal_type,
        )
    )
    slot = WeeklySlot(
        user_id=user_id,
        week_start=get_week_start(),
        day_index=body.day_index,
        meal_type=body.meal_type,
        recipe_id=body.recipe_id,
    )
    db.add(slot)
    await db.commit()
    await db.refresh(slot)

    result = await db.execute(
        select(WeeklySlot).where(WeeklySlot.id == slot.id).options(selectinload(WeeklySlot.recipe))
    )
    return result.scalar_one()


@router.delete("/slots/{slot_id}", status_code=204)
async def remove_slot(slot_id: uuid.UUID, user_id: CurrentUserDep, db: DBDep):
    result = await db.execute(
        select(WeeklySlot).where(WeeklySlot.id == slot_id, WeeklySlot.user_id == user_id)
    )
    slot = result.scalar_one_or_none()
    if slot:
        await db.delete(slot)
        await db.commit()
