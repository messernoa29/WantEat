"""Tests unitaires pour le moteur de scoring des recettes."""
import pytest
from unittest.mock import MagicMock

from app.services.score_service import calculate_recipe_score


def make_macros(calories=2000, protein_g=150, fat_g=70, **kwargs):
    macros = MagicMock()
    macros.calories = calories
    macros.protein_g = protein_g
    macros.fat_g = fat_g
    for k, v in kwargs.items():
        setattr(macros, k, v)
    return macros


# ── Score parfait ─────────────────────────────────────────────────────────────

class TestPerfectScore:
    def test_recette_ideale_score_eleve(self):
        """Une recette qui correspond exactement aux macros par repas."""
        macros = make_macros(calories=2100, protein_g=150, fat_g=70)
        # 3 repas → par repas : 700 kcal, 50g prot, 23g graisses
        score = calculate_recipe_score(700, 50, 23, macros, meals_per_day=3)
        assert score >= 80

    def test_recette_haute_proteine_score_eleve(self):
        """Une recette avec beaucoup de protéines score bien."""
        macros = make_macros(calories=2100, protein_g=150, fat_g=70)
        score = calculate_recipe_score(700, 80, 20, macros, meals_per_day=3)
        assert score >= 70


# ── Cas limites ───────────────────────────────────────────────────────────────

class TestEdgeCases:
    def test_zero_calories_retourne_zero(self):
        macros = make_macros()
        assert calculate_recipe_score(0, 50, 20, macros) == 0

    def test_zero_proteine_retourne_zero(self):
        macros = make_macros()
        assert calculate_recipe_score(500, 0, 20, macros) == 0

    def test_score_entre_0_et_100(self):
        macros = make_macros(calories=2000, protein_g=150, fat_g=70)
        for cal, prot, fat in [(100, 5, 2), (2000, 200, 100), (500, 40, 15)]:
            score = calculate_recipe_score(cal, prot, fat, macros, meals_per_day=3)
            assert 0 <= score <= 100, f"Score hors limites: {score} pour cal={cal}"

    def test_meals_per_day_zero_ne_crash_pas(self):
        macros = make_macros()
        # meals_per_day=0 → max(0, 1) = 1, pas de division par zéro
        score = calculate_recipe_score(500, 40, 15, macros, meals_per_day=0)
        assert 0 <= score <= 100


# ── Cohérence des scores ──────────────────────────────────────────────────────

class TestScoreCoherence:
    def test_plus_de_proteines_meilleur_score(self):
        """Plus une recette est protéinée (jusqu'à 150% cible), meilleur est son score."""
        macros = make_macros(calories=2100, protein_g=150, fat_g=70)
        score_low_prot = calculate_recipe_score(700, 20, 20, macros, meals_per_day=3)
        score_high_prot = calculate_recipe_score(700, 60, 20, macros, meals_per_day=3)
        assert score_high_prot > score_low_prot

    def test_calories_trop_elevees_baissent_score(self):
        """Une recette trop calorique par rapport à la cible pénalise le score."""
        macros = make_macros(calories=2100, protein_g=150, fat_g=70)
        score_ok = calculate_recipe_score(700, 50, 20, macros, meals_per_day=3)
        score_too_much = calculate_recipe_score(2000, 50, 20, macros, meals_per_day=3)
        assert score_ok > score_too_much

    def test_calories_trop_basses_baissent_score(self):
        """Une recette trop pauvre en calories pénalise aussi le score."""
        macros = make_macros(calories=2100, protein_g=150, fat_g=70)
        score_ok = calculate_recipe_score(700, 50, 20, macros, meals_per_day=3)
        score_too_low = calculate_recipe_score(100, 50, 20, macros, meals_per_day=3)
        assert score_ok > score_too_low

    def test_5_repas_par_jour_cibles_plus_petites(self):
        """Avec plus de repas par jour, les cibles par repas sont plus petites."""
        macros = make_macros(calories=2000, protein_g=150, fat_g=70)
        # Une recette de 400 kcal est bien adaptée à 5 repas (cible: 400 kcal/repas)
        score_5 = calculate_recipe_score(400, 30, 14, macros, meals_per_day=5)
        # Mais pas à 2 repas (cible: 1000 kcal/repas)
        score_2 = calculate_recipe_score(400, 30, 14, macros, meals_per_day=2)
        assert score_5 > score_2

    def test_recette_sauce_legere_score_correct(self):
        """Sauce légère (peu de calories, peu de protéines) → score faible."""
        macros = make_macros(calories=2000, protein_g=150, fat_g=70)
        score = calculate_recipe_score(60, 2, 5, macros, meals_per_day=3)
        assert score < 50
