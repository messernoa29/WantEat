from app.schemas.macros import MacrosRead


def calculate_recipe_score(
    calories: float,
    protein: float,
    fat: float,
    macros: MacrosRead,
    meals_per_day: int = 3,
) -> int:
    if not calories or not protein:
        return 0

    n = max(meals_per_day, 1)
    cal_per_meal = macros.calories / n
    protein_per_meal = macros.protein_g / n
    fat_per_meal = macros.fat_g / n

    # Calorie fit (40%): recipe close to a typical meal portion
    cal_ratio = calories / max(cal_per_meal, 1)
    cal_score = max(0.0, 100 - abs(cal_ratio - 1.0) * 150)

    # Protein score (40%): higher protein up to 150% of per-meal target = perfect
    protein_ratio = protein / max(protein_per_meal, 1)
    protein_score = min(protein_ratio / 1.5, 1.0) * 100

    # Fat score (20%): close to per-meal fat target
    fat_ratio = (fat or 0) / max(fat_per_meal, 1)
    fat_score = max(0.0, 100 - abs(fat_ratio - 1.0) * 100)

    total = cal_score * 0.4 + protein_score * 0.4 + fat_score * 0.2
    return max(0, min(100, round(total)))
