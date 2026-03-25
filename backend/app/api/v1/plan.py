import json
import logging
import uuid
from datetime import date, timedelta

from fastapi import APIRouter, BackgroundTasks
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.models.meal_plan import DayPlan, Meal, MealPlan
from app.db.models.user import UserProfile
from app.dependencies import CurrentUserDep, DBDep
from app.core.exceptions import NotFoundError, BadRequestError
from app.schemas.meal_plan import MealPlanRead
from app.services.macros_service import calculate_macros
from app.services.plan_service import build_plan_prompt, save_plan_to_db
from app.integrations.anthropic_client import generate_meal_plan

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/plan", tags=["plan"])


def get_week_start() -> date:
    today = date.today()
    return today - timedelta(days=today.weekday())


async def _generate_and_save(user_id: uuid.UUID, plan_id: uuid.UUID):
    from app.db.session import AsyncSessionLocal
    async with AsyncSessionLocal() as session:
        try:
            result = await session.execute(
                select(UserProfile).where(UserProfile.user_id == user_id)
            )
            profile = result.scalar_one_or_none()
            if not profile:
                logger.error(f"Profile not found for user {user_id}")
                return

            macros = calculate_macros(profile)
            prompt = build_plan_prompt(profile, macros)

            logger.info(f"Calling Claude for user {user_id}...")
            raw = await generate_meal_plan(prompt)
            logger.info(f"Claude responded ({len(raw)} chars)")

            # Nettoyer si Claude ajoute des backticks
            raw = raw.strip()
            if raw.startswith("```"):
                raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()

            plan_data = json.loads(raw)
            await save_plan_to_db(session, user_id, plan_id, plan_data, get_week_start())
            logger.info(f"Plan saved for user {user_id}")

        except json.JSONDecodeError as e:
            logger.error(f"JSON parse error for user {user_id}: {e}")
            await _mark_failed(session, plan_id)
        except Exception as e:
            logger.error(f"Plan generation failed for user {user_id}: {e}", exc_info=True)
            await _mark_failed(session, plan_id)


async def _mark_failed(session, plan_id: uuid.UUID):
    try:
        result = await session.execute(select(MealPlan).where(MealPlan.plan_id == plan_id))
        plan = result.scalar_one_or_none()
        if plan:
            plan.status = "failed"
            await session.commit()
    except Exception:
        pass


@router.post("/generate", status_code=202)
async def generate_plan(
    user_id: CurrentUserDep,
    db: DBDep,
    background_tasks: BackgroundTasks,
) -> dict:
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    if not result.scalar_one_or_none():
        raise BadRequestError("Crée ton profil avant de générer un plan")

    # Supprimer l'ancien plan pending/failed s'il existe
    existing = await db.execute(
        select(MealPlan).where(
            MealPlan.user_id == user_id,
            MealPlan.week_start == get_week_start(),
        )
    )
    old = existing.scalar_one_or_none()
    if old:
        await db.delete(old)
        await db.commit()

    plan = MealPlan(user_id=user_id, week_start=get_week_start(), status="pending")
    db.add(plan)
    await db.commit()
    await db.refresh(plan)

    background_tasks.add_task(_generate_and_save, user_id, plan.plan_id)
    return {"status": "generating", "plan_id": str(plan.plan_id)}


@router.get("/current", response_model=MealPlanRead)
async def get_current_plan(user_id: CurrentUserDep, db: DBDep) -> MealPlan:
    result = await db.execute(
        select(MealPlan)
        .where(MealPlan.user_id == user_id, MealPlan.week_start == get_week_start())
        .options(
            selectinload(MealPlan.days).selectinload(DayPlan.meals)
        )
        .order_by(MealPlan.week_start.desc())
    )
    plan = result.scalar_one_or_none()
    if not plan:
        raise NotFoundError("Aucun plan pour cette semaine")
    return plan


@router.patch("/{day_index}/{meal_id}/swap", status_code=200)
async def swap_meal(
    day_index: int,
    meal_id: uuid.UUID,
    user_id: CurrentUserDep,
    db: DBDep,
) -> dict:
    return {"status": "not_implemented_yet"}
