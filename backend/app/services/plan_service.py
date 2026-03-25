import json
import logging
import uuid
from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.meal_plan import DayPlan, Meal, MealPlan
from app.db.models.user import UserProfile
from app.integrations.anthropic_client import generate_meal_plan
from app.schemas.macros import MacrosRead

logger = logging.getLogger(__name__)


def build_plan_prompt(profile: UserProfile, macros: MacrosRead) -> str:
    sport_indices = profile.sport_days or []
    return f"""Coach nutrition fit food. Génère un plan 7 jours en JSON pur (0 markdown).

PROFIL: {profile.age}ans {profile.weight_kg}kg {profile.height_cm}cm {profile.gender}, objectif={profile.goal}, régime={profile.diet_type}, cuisine={profile.cooking_time}, repas/jour={profile.meals_per_day}
MACROS/JOUR: {macros.calories}kcal P={macros.protein_g}g G={macros.carbs_g}g L={macros.fat_g}g
JOURS SPORT (indices 0=lun): {sport_indices}

RÈGLES: macros ±5%, varier protéines, ingrédients dispo France, recettes modernes (bowls, skyr, patate douce...), sauce légère + plating_tip par repas.

FORMAT (respecte exactement ce schéma):
{{"days":[{{"day_index":0,"is_sport_day":true,"total_calories":{macros.calories},"total_protein":{macros.protein_g},"total_carbs":{macros.carbs_g},"total_fat":{macros.fat_g},"meals":[{{"meal_type":"déjeuner","name":"Bowl poulet teriyaki","ingredients":[{{"name":"poulet","quantity_g":150}}],"calories":520,"protein":48,"carbs":55,"fat":8,"prep_time_min":25,"steps":["Cuire le poulet","Assembler le bowl"],"sauce":{{"name":"Sauce teriyaki","ingredients":["soja 1cs","miel 1cc"],"kcal_per_serving":35}},"plating_tip":"Graines de sésame sur le dessus"}}]}}]}}"""


async def save_plan_to_db(
    session: AsyncSession,
    user_id: uuid.UUID,
    plan_id: uuid.UUID,
    plan_data: dict,
    week_start: date,
) -> MealPlan:
    from sqlalchemy import select
    result = await session.execute(
        select(MealPlan).where(MealPlan.plan_id == plan_id)
    )
    plan = result.scalar_one_or_none()
    if not plan:
        plan = MealPlan(plan_id=plan_id, user_id=user_id, week_start=week_start, status="pending")
        session.add(plan)

    plan.status = "ready"
    await session.flush()

    for day_data in plan_data.get("days", []):
        day = DayPlan(
            plan_id=plan.plan_id,
            day_index=day_data["day_index"],
            is_sport_day=day_data.get("is_sport_day", False),
            total_calories=day_data.get("total_calories"),
            total_protein=day_data.get("total_protein"),
            total_carbs=day_data.get("total_carbs"),
            total_fat=day_data.get("total_fat"),
        )
        session.add(day)
        await session.flush()

        for meal_data in day_data.get("meals", []):
            meal = Meal(
                day_id=day.day_id,
                meal_type=meal_data.get("meal_type", "repas"),
                name=meal_data.get("name", ""),
                ingredients=meal_data.get("ingredients", []),
                calories=meal_data.get("calories"),
                protein=meal_data.get("protein"),
                carbs=meal_data.get("carbs"),
                fat=meal_data.get("fat"),
                prep_time_min=meal_data.get("prep_time_min", 20),
                steps=meal_data.get("steps", []),
                sauce=meal_data.get("sauce"),
                plating_tip=meal_data.get("plating_tip"),
            )
            session.add(meal)

    await session.commit()
    await session.refresh(plan)
    return plan
