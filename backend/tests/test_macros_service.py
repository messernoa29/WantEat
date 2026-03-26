"""Tests unitaires pour le moteur de calcul des macros."""
import pytest
from unittest.mock import MagicMock

from app.services.macros_service import calculate_macros


def make_profile(**kwargs):
    """Crée un UserProfile mock avec des valeurs par défaut."""
    defaults = {
        "age": 25,
        "weight_kg": 75.0,
        "height_cm": 175.0,
        "gender": "homme",
        "goal": "maintain",
        "sport_days": [0, 2, 4],  # 3 jours/semaine
        "meals_per_day": 3,
        "target_weight_kg": None,
    }
    defaults.update(kwargs)
    profile = MagicMock()
    for k, v in defaults.items():
        setattr(profile, k, v)
    return profile


# ── BMR ──────────────────────────────────────────────────────────────────────

class TestBMR:
    def test_homme_bmr(self):
        profile = make_profile(age=25, weight_kg=80, height_cm=180, gender="homme", sport_days=[])
        result = calculate_macros(profile)
        # Mifflin-St Jeor homme: 10*80 + 6.25*180 - 5*25 + 5 = 800 + 1125 - 125 + 5 = 1805
        assert result.bmr == 1805

    def test_femme_bmr(self):
        profile = make_profile(age=30, weight_kg=60, height_cm=165, gender="femme", sport_days=[])
        result = calculate_macros(profile)
        # Mifflin-St Jeor femme: 10*60 + 6.25*165 - 5*30 - 161 = 600 + 1031.25 - 150 - 161 = 1320
        assert result.bmr == 1320

    def test_bmr_augmente_avec_poids(self):
        r1 = calculate_macros(make_profile(weight_kg=70, sport_days=[]))
        r2 = calculate_macros(make_profile(weight_kg=90, sport_days=[]))
        assert r2.bmr > r1.bmr

    def test_bmr_augmente_avec_taille(self):
        r1 = calculate_macros(make_profile(height_cm=160, sport_days=[]))
        r2 = calculate_macros(make_profile(height_cm=190, sport_days=[]))
        assert r2.bmr > r1.bmr

    def test_bmr_diminue_avec_age(self):
        r1 = calculate_macros(make_profile(age=20, sport_days=[]))
        r2 = calculate_macros(make_profile(age=50, sport_days=[]))
        assert r1.bmr > r2.bmr


# ── TDEE ─────────────────────────────────────────────────────────────────────

class TestTDEE:
    def test_tdee_sport_superieur_tdee_rest(self):
        result = calculate_macros(make_profile())
        assert result.tdee_sport > result.tdee_rest

    def test_tdee_sport_factor_155(self):
        profile = make_profile(age=25, weight_kg=80, height_cm=180, gender="homme", sport_days=[])
        result = calculate_macros(profile)
        expected_sport = round(result.bmr * 1.55)
        assert result.tdee_sport == expected_sport

    def test_tdee_rest_factor_120(self):
        profile = make_profile(age=25, weight_kg=80, height_cm=180, gender="homme", sport_days=[])
        result = calculate_macros(profile)
        expected_rest = round(result.bmr * 1.20)
        assert result.tdee_rest == expected_rest

    def test_tdee_moyen_entre_sport_et_rest(self):
        result = calculate_macros(make_profile(sport_days=[0, 2, 4]))  # 3 jours sport
        assert result.tdee_rest <= result.tdee <= result.tdee_sport

    def test_0_jours_sport_tdee_egal_rest(self):
        result = calculate_macros(make_profile(sport_days=[]))
        assert result.tdee == result.tdee_rest

    def test_7_jours_sport_tdee_egal_sport(self):
        result = calculate_macros(make_profile(sport_days=[0, 1, 2, 3, 4, 5, 6]))
        assert result.tdee == result.tdee_sport


# ── Objectifs caloriques ──────────────────────────────────────────────────────

class TestCaloriesGoal:
    def test_cut_calories_inferieures_maintain(self):
        r_cut = calculate_macros(make_profile(goal="cut"))
        r_maintain = calculate_macros(make_profile(goal="maintain"))
        assert r_cut.calories < r_maintain.calories

    def test_bulk_calories_superieures_maintain(self):
        r_bulk = calculate_macros(make_profile(goal="bulk"))
        r_maintain = calculate_macros(make_profile(goal="maintain"))
        assert r_bulk.calories > r_maintain.calories

    def test_cut_deficit_max_20_pourcent(self):
        """Le déficit ne doit jamais dépasser 20% du TDEE."""
        result = calculate_macros(make_profile(goal="cut"))
        max_deficit = result.tdee * 0.20
        actual_deficit = result.tdee - result.calories
        assert actual_deficit <= max_deficit + 1  # +1 pour arrondi

    def test_bulk_surplus_250_kcal(self):
        result = calculate_macros(make_profile(goal="bulk", sport_days=[0]))
        # Jours sport : tdee_sport + 250
        assert result.calories_sport == result.tdee_sport + 250
        assert result.calories_rest == result.tdee_rest + 250

    def test_maintain_calories_egales_tdee(self):
        result = calculate_macros(make_profile(goal="maintain"))
        assert result.calories == result.tdee


# ── Protéines ─────────────────────────────────────────────────────────────────

class TestProteins:
    def test_cut_protein_2g_par_kg(self):
        profile = make_profile(weight_kg=80, goal="cut")
        result = calculate_macros(profile)
        assert result.protein_g == 2.0 * 80

    def test_bulk_protein_22g_par_kg(self):
        profile = make_profile(weight_kg=80, goal="bulk")
        result = calculate_macros(profile)
        assert result.protein_g == 2.2 * 80

    def test_maintain_protein_18g_par_kg(self):
        profile = make_profile(weight_kg=80, goal="maintain")
        result = calculate_macros(profile)
        assert result.protein_g == 1.8 * 80

    def test_glucides_positifs(self):
        """Les glucides ne doivent jamais être négatifs."""
        result = calculate_macros(make_profile(goal="cut", weight_kg=50, height_cm=155))
        assert result.carbs_g >= 0


# ── IMC & poids idéal ─────────────────────────────────────────────────────────

class TestBMI:
    def test_bmi_calcul(self):
        profile = make_profile(weight_kg=75, height_cm=175, sport_days=[])
        result = calculate_macros(profile)
        expected = round(75 / (1.75 ** 2), 1)
        assert result.bmi == expected

    def test_bmi_surpoids(self):
        result = calculate_macros(make_profile(weight_kg=100, height_cm=170, sport_days=[]))
        assert result.bmi > 25

    def test_poids_ideal_homme(self):
        profile = make_profile(height_cm=180, gender="homme", sport_days=[])
        result = calculate_macros(profile)
        # Lorentz homme: 180 - 100 - (180-150)/4 = 80 - 7.5 = 72.5
        assert result.ideal_weight_kg == 72.5

    def test_poids_ideal_femme(self):
        profile = make_profile(height_cm=165, gender="femme", sport_days=[])
        result = calculate_macros(profile)
        # Lorentz femme: 165 - 100 - (165-150)/2 = 65 - 7.5 = 57.5
        assert result.ideal_weight_kg == 57.5


# ── Hydratation ───────────────────────────────────────────────────────────────

class TestWater:
    def test_water_35ml_par_kg(self):
        result = calculate_macros(make_profile(weight_kg=80, sport_days=[]))
        assert result.water_goal_ml == 35 * 80

    def test_water_augmente_avec_poids(self):
        r1 = calculate_macros(make_profile(weight_kg=60, sport_days=[]))
        r2 = calculate_macros(make_profile(weight_kg=90, sport_days=[]))
        assert r2.water_goal_ml > r1.water_goal_ml
