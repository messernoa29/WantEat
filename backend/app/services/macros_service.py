from app.db.models.user import UserProfile
from app.schemas.macros import MacrosRead


def calculate_macros(profile: UserProfile) -> MacrosRead:
    """
    Macro engine v2 — Mifflin-St Jeor + TDEE différencié sport/repos.
    Déficit max 20% du TDEE pour protéger la masse musculaire.
    """
    # ── BMR (Mifflin-St Jeor, plus précis que Harris-Benedict) ───
    base = 10 * profile.weight_kg + 6.25 * profile.height_cm - 5 * profile.age
    bmr = base + 5 if profile.gender == "homme" else base - 161

    # ── TDEE différencié par type de journée ─────────────────────
    tdee_sport = bmr * 1.55   # actif (entraînement)
    tdee_rest = bmr * 1.20    # sédentaire (repos)

    n_sport = len(profile.sport_days or [])
    n_rest = 7 - n_sport
    tdee_avg = (tdee_sport * n_sport + tdee_rest * n_rest) / 7

    # ── Ajustement calorique selon objectif ──────────────────────
    goal = profile.goal
    max_deficit = tdee_avg * 0.20  # jamais plus de 20% du TDEE

    if goal == "cut":
        deficit = min(350, max_deficit)
        cal_sport = tdee_sport - deficit
        cal_rest = tdee_rest - deficit
    elif goal == "recomp":
        # Sport days: maintenance — rest days: léger déficit
        cal_sport = tdee_sport
        cal_rest = tdee_rest - min(200, max_deficit * 0.6)
    elif goal == "bulk":
        cal_sport = tdee_sport + 250
        cal_rest = tdee_rest + 250
    else:  # maintain
        cal_sport = tdee_sport
        cal_rest = tdee_rest

    cal_avg = (cal_sport * n_sport + cal_rest * n_rest) / 7

    # ── Macros ───────────────────────────────────────────────────
    prot_g_per_kg = {"cut": 2.0, "recomp": 2.0, "bulk": 2.2}.get(goal, 1.8)
    protein_g = prot_g_per_kg * profile.weight_kg

    fat_g = cal_avg * 0.25 / 9
    carbs_g = max(0.0, (cal_avg - protein_g * 4 - fat_g * 9) / 4)

    # ── IMC & poids idéal (Lorentz) ──────────────────────────────
    h_m = profile.height_cm / 100
    bmi = round(profile.weight_kg / h_m ** 2, 1)

    if profile.gender == "homme":
        ideal_weight = profile.height_cm - 100 - (profile.height_cm - 150) / 4
    else:
        ideal_weight = profile.height_cm - 100 - (profile.height_cm - 150) / 2
    ideal_weight = max(40.0, ideal_weight)

    # ── Projection temporelle ────────────────────────────────────
    deficit_daily = tdee_avg - cal_avg
    # positif = déficit = perte de gras ; négatif = surplus = prise de masse
    weekly_change_kg = round(deficit_daily * 7 / 7700, 3)

    weeks_to_goal: int | None = None
    if (
        getattr(profile, "target_weight_kg", None)
        and abs(profile.weight_kg - profile.target_weight_kg) > 0.5
        and abs(weekly_change_kg) > 0.01
    ):
        diff = abs(profile.weight_kg - profile.target_weight_kg)
        weeks_to_goal = max(1, round(diff / abs(weekly_change_kg)))

    # ── Hydratation de base ──────────────────────────────────────
    water_goal_ml = round(35 * profile.weight_kg)  # +500ml si jour de sport (ajouté dans l'API)

    return MacrosRead(
        calories=round(cal_avg),
        protein_g=round(protein_g, 1),
        carbs_g=round(carbs_g, 1),
        fat_g=round(fat_g, 1),
        bmr=round(bmr),
        tdee=round(tdee_avg),
        tdee_sport=round(tdee_sport),
        tdee_rest=round(tdee_rest),
        calories_sport=round(cal_sport),
        calories_rest=round(cal_rest),
        bmi=bmi,
        ideal_weight_kg=round(ideal_weight, 1),
        weekly_change_kg=weekly_change_kg,
        weeks_to_goal=weeks_to_goal,
        water_goal_ml=water_goal_ml,
    )
