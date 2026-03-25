from typing import Optional
from pydantic import BaseModel


class MacrosRead(BaseModel):
    # Macros moyennes (pondérées sport/repos)
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float

    # Métabolisme
    bmr: float
    tdee: float           # TDEE moyen semaine
    tdee_sport: float     # TDEE jours sport (BMR × 1.55)
    tdee_rest: float      # TDEE jours repos (BMR × 1.20)

    # Macros par type de journée
    calories_sport: float
    calories_rest: float

    # Corps & santé
    bmi: float
    ideal_weight_kg: float

    # Progression vers objectif
    weekly_change_kg: Optional[float] = None   # négatif = perte, positif = gain
    weeks_to_goal: Optional[int] = None

    # Hydratation
    water_goal_ml: int
