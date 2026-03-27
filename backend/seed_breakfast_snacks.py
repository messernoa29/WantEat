"""
Seed — Ajoute les catégories Petit Déjeuner & Collation avec leurs recettes.
"""
import asyncio
import uuid
from sqlalchemy import select, text
from app.db.session import AsyncSessionLocal

# ── IDs fixes pour reproductibilité ──────────────────────────────────────────
CAT_BREAKFAST_ID  = "a1000000-0000-0000-0000-000000000001"
CAT_SNACK_ID      = "a1000000-0000-0000-0000-000000000002"

SUB_IDS = {
    # Petit déjeuner
    "sucre":        "b1000000-0000-0000-0000-000000000001",
    "sale":         "b1000000-0000-0000-0000-000000000002",
    "smoothie":     "b1000000-0000-0000-0000-000000000003",
    "oats":         "b1000000-0000-0000-0000-000000000004",
    # Collation
    "snack_sucre":  "b1000000-0000-0000-0000-000000000005",
    "snack_sale":   "b1000000-0000-0000-0000-000000000006",
    "snack_sain":   "b1000000-0000-0000-0000-000000000007",
    "snack_sport":  "b1000000-0000-0000-0000-000000000008",
}

SUB_SLUGS = {
    "sucre":        ("pdej-sucre",       "🥞"),
    "sale":         ("pdej-sale",        "🍳"),
    "smoothie":     ("pdej-smoothie",    "🥤"),
    "oats":         ("pdej-oats",        "🌾"),
    "snack_sucre":  ("snack-sucre",      "🍫"),
    "snack_sale":   ("snack-sale",       "🧀"),
    "snack_sain":   ("snack-sain",       "🍎"),
    "snack_sport":  ("snack-sport",      "💪"),
}

# Vidéos TikTok réelles (partagées, style "inspiré de")
TIKTOK_BREAKFAST = [
    ("@tiboinshape",              "Tibo InShape",              "7509926549798358294"),
    ("@tiboinshape",              "Tibo InShape",              "7226753036041964826"),
    ("@recettes.fitness.express", "Recettes Fitness Express",  "7302494945078807841"),
    ("@salutcestclaire",          "Salut c'est Claire",        "7460928738369359126"),
]
TIKTOK_SNACK = [
    ("@recettes.fitness.express", "Recettes Fitness Express",  "7362549189298916640"),
    ("@saskinax",                 "Saskinax",                  "7506164608076500246"),
    ("@tiboinshape",              "Tibo InShape",              "7509926549798358294"),
    ("@yohanit00",                "Yohan It",                  "7268365976276684065"),
]

_bi, _si = 0, 0

def next_tiktok(pool):
    global _bi, _si
    if pool is TIKTOK_BREAKFAST:
        h, n, v = pool[_bi % len(pool)]; _bi += 1
    else:
        h, n, v = pool[_si % len(pool)]; _si += 1
    return h, n, v, f"https://www.tiktok.com/{h}/video/{v}"


IMAGES = {
    "pancake":  "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80",
    "oats":     "https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=600&q=80",
    "smoothie": "https://images.unsplash.com/photo-1490474504059-bf2db5ab2348?w=600&q=80",
    "eggs":     "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=600&q=80",
    "toast":    "https://images.unsplash.com/photo-1541519227354-08fa5d50c820?w=600&q=80",
    "yogurt":   "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80",
    "muffin":   "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&q=80",
    "granola":  "https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=600&q=80",
    "bar":      "https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80",
    "fruit":    "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=600&q=80",
    "nuts":     "https://images.unsplash.com/photo-1464979681340-bdd28a61699e?w=600&q=80",
    "protein":  "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=600&q=80",
    "hummus":   "https://images.unsplash.com/photo-1637679635895-93a59cd81d62?w=600&q=80",
    "cheese":   "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&q=80",
    "default":  "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80",
}

def img(key): return [IMAGES.get(key, IMAGES["default"])]


BREAKFAST_RECIPES = [
    # ── Sucré ──────────────────────────────────────────────────────────────────
    {
        "sub": "sucre",
        "name": "Pancakes protéinés avoine & banane",
        "description": "Pancakes moelleux ultra simples sans farine blanche, riches en protéines.",
        "calories": 380, "protein": 28, "carbs": 42, "fat": 8,
        "prep_time_min": 10, "difficulty": "facile",
        "image": "pancake",
        "tags": ["pancakes", "protéines", "fitness", "healthy"],
        "ingredients": [
            {"name": "Flocons d'avoine", "quantity_g": 80, "unit": "g"},
            {"name": "Banane", "quantity_g": 100, "unit": "g"},
            {"name": "Œufs", "quantity_g": 120, "unit": "g"},
            {"name": "Yaourt grec 0%", "quantity_g": 100, "unit": "g"},
            {"name": "Levure chimique", "quantity_g": 5, "unit": "g"},
        ],
        "steps": [
            {"text": "Mixer les flocons d'avoine en farine.", "timer_min": None},
            {"text": "Écraser la banane, mélanger avec les œufs et le yaourt.", "timer_min": None},
            {"text": "Incorporer la farine d'avoine et la levure.", "timer_min": None},
            {"text": "Cuire à la poêle antiadhésive 2-3 min par face.", "timer_min": 3},
        ],
        "plating_tip": "Garnir de fruits frais et d'un filet de miel.",
        "tiktok_pool": TIKTOK_BREAKFAST,
    },
    {
        "sub": "sucre",
        "name": "Bowl açaï protéiné",
        "description": "Bowl frais et vitaminé avec une base açaï et du granola fait maison.",
        "calories": 420, "protein": 22, "carbs": 55, "fat": 10,
        "prep_time_min": 8, "difficulty": "facile",
        "image": "smoothie",
        "tags": ["açaï", "bowl", "healthy", "antioxydant"],
        "ingredients": [
            {"name": "Pulpe d'açaï surgelée", "quantity_g": 100, "unit": "g"},
            {"name": "Banane surgelée", "quantity_g": 80, "unit": "g"},
            {"name": "Lait végétal", "quantity_g": 80, "unit": "ml"},
            {"name": "Protéine vanille", "quantity_g": 30, "unit": "g"},
            {"name": "Granola", "quantity_g": 40, "unit": "g"},
            {"name": "Myrtilles fraîches", "quantity_g": 50, "unit": "g"},
        ],
        "steps": [
            {"text": "Mixer açaï, banane et lait végétal jusqu'à consistance crémeuse.", "timer_min": None},
            {"text": "Ajouter la protéine et mixer 10 secondes.", "timer_min": None},
            {"text": "Verser dans un bol, garnir de granola et myrtilles.", "timer_min": None},
        ],
        "plating_tip": "Disposer les toppings en rangées pour un effet visuel.",
        "tiktok_pool": TIKTOK_BREAKFAST,
    },
    {
        "sub": "sucre",
        "name": "French toast protéiné",
        "description": "Pain perdu revisité fitness avec pain complet et blanc d'œuf.",
        "calories": 360, "protein": 26, "carbs": 38, "fat": 9,
        "prep_time_min": 10, "difficulty": "facile",
        "image": "toast",
        "tags": ["french-toast", "protéines", "sucré", "healthy"],
        "ingredients": [
            {"name": "Pain complet", "quantity_g": 80, "unit": "g"},
            {"name": "Œufs entiers", "quantity_g": 100, "unit": "g"},
            {"name": "Blanc d'œuf", "quantity_g": 60, "unit": "g"},
            {"name": "Lait écrémé", "quantity_g": 50, "unit": "ml"},
            {"name": "Cannelle", "quantity_g": 2, "unit": "g"},
            {"name": "Extrait de vanille", "quantity_g": 2, "unit": "ml"},
        ],
        "steps": [
            {"text": "Battre les œufs, blancs, lait, cannelle et vanille.", "timer_min": None},
            {"text": "Tremper les tranches de pain dans le mélange.", "timer_min": None},
            {"text": "Cuire à la poêle 2-3 min par face à feu moyen.", "timer_min": 3},
        ],
        "plating_tip": "Servir avec des fraises et une cuillère de fromage blanc.",
        "tiktok_pool": TIKTOK_BREAKFAST,
    },
    {
        "sub": "sucre",
        "name": "Overnight oats chocolat & noisette",
        "description": "Préparés la veille, prêts en 30 secondes le matin.",
        "calories": 410, "protein": 20, "carbs": 52, "fat": 12,
        "prep_time_min": 5, "difficulty": "facile",
        "image": "oats",
        "tags": ["overnight-oats", "chocolat", "meal-prep", "healthy"],
        "ingredients": [
            {"name": "Flocons d'avoine", "quantity_g": 70, "unit": "g"},
            {"name": "Lait écrémé", "quantity_g": 150, "unit": "ml"},
            {"name": "Yaourt grec 0%", "quantity_g": 80, "unit": "g"},
            {"name": "Cacao en poudre non sucré", "quantity_g": 10, "unit": "g"},
            {"name": "Purée de noisette", "quantity_g": 15, "unit": "g"},
            {"name": "Miel", "quantity_g": 15, "unit": "g"},
            {"name": "Graines de chia", "quantity_g": 10, "unit": "g"},
        ],
        "steps": [
            {"text": "Mélanger tous les ingrédients dans un bocal.", "timer_min": None},
            {"text": "Couvrir et réfrigérer toute la nuit (minimum 6h).", "timer_min": None},
            {"text": "Le matin, remuer et ajouter un peu de lait si trop épais.", "timer_min": None},
        ],
        "plating_tip": "Décorer de noisettes concassées et d'un trait de purée de noisette.",
        "tiktok_pool": TIKTOK_BREAKFAST,
    },
    {
        "sub": "oats",
        "name": "Porridge protéiné banane & beurre de cacahuète",
        "description": "Porridge chaud crémeux et rassasiant pour bien démarrer.",
        "calories": 450, "protein": 32, "carbs": 48, "fat": 13,
        "prep_time_min": 8, "difficulty": "facile",
        "image": "oats",
        "tags": ["porridge", "protéines", "beurre-cacahuète", "chaud"],
        "ingredients": [
            {"name": "Flocons d'avoine", "quantity_g": 80, "unit": "g"},
            {"name": "Lait écrémé", "quantity_g": 200, "unit": "ml"},
            {"name": "Protéine vanille", "quantity_g": 25, "unit": "g"},
            {"name": "Banane", "quantity_g": 80, "unit": "g"},
            {"name": "Beurre de cacahuète", "quantity_g": 20, "unit": "g"},
        ],
        "steps": [
            {"text": "Chauffer le lait dans une casserole à feu moyen.", "timer_min": None},
            {"text": "Ajouter les flocons, cuire 4-5 min en remuant.", "timer_min": 5},
            {"text": "Hors du feu, incorporer la protéine et remuer.", "timer_min": None},
            {"text": "Servir avec la banane tranchée et le beurre de cacahuète.", "timer_min": None},
        ],
        "plating_tip": "Swirl de beurre de cacahuète sur le dessus.",
        "tiktok_pool": TIKTOK_BREAKFAST,
    },
    {
        "sub": "oats",
        "name": "Muesli maison fruits secs & graines",
        "description": "Muesli croustillant fait en 10 min, conservable 2 semaines.",
        "calories": 380, "protein": 12, "carbs": 50, "fat": 14,
        "prep_time_min": 10, "difficulty": "facile",
        "image": "granola",
        "tags": ["granola", "meal-prep", "sain", "fruits-secs"],
        "ingredients": [
            {"name": "Flocons d'avoine", "quantity_g": 100, "unit": "g"},
            {"name": "Amandes effilées", "quantity_g": 30, "unit": "g"},
            {"name": "Noix de cajou", "quantity_g": 20, "unit": "g"},
            {"name": "Graines de tournesol", "quantity_g": 15, "unit": "g"},
            {"name": "Raisins secs", "quantity_g": 25, "unit": "g"},
            {"name": "Miel", "quantity_g": 20, "unit": "g"},
            {"name": "Huile de coco", "quantity_g": 10, "unit": "g"},
        ],
        "steps": [
            {"text": "Préchauffer le four à 180°C.", "timer_min": None},
            {"text": "Mélanger flocons, fruits secs, graines, miel et huile.", "timer_min": None},
            {"text": "Étaler sur plaque et cuire 12-15 min en remuant à mi-cuisson.", "timer_min": 15},
            {"text": "Laisser refroidir complètement avant de stocker.", "timer_min": None},
        ],
        "plating_tip": "Servir avec du lait végétal et des fruits frais.",
        "tiktok_pool": TIKTOK_BREAKFAST,
    },
    # ── Salé ───────────────────────────────────────────────────────────────────
    {
        "sub": "sale",
        "name": "Œufs brouillés à l'avocat sur toast",
        "description": "Le classique du petit déj fitness, riche en bonnes graisses.",
        "calories": 420, "protein": 22, "carbs": 28, "fat": 22,
        "prep_time_min": 8, "difficulty": "facile",
        "image": "eggs",
        "tags": ["œufs", "avocat", "toast", "healthy"],
        "ingredients": [
            {"name": "Œufs", "quantity_g": 150, "unit": "g"},
            {"name": "Avocat", "quantity_g": 80, "unit": "g"},
            {"name": "Pain complet", "quantity_g": 60, "unit": "g"},
            {"name": "Citron", "quantity_g": 10, "unit": "ml"},
            {"name": "Sel, poivre", "quantity_g": 2, "unit": "g"},
        ],
        "steps": [
            {"text": "Toaster le pain.", "timer_min": None},
            {"text": "Écraser l'avocat avec le citron, sel, poivre.", "timer_min": None},
            {"text": "Brouiller les œufs à feu doux 3-4 min.", "timer_min": 4},
            {"text": "Tartiner le pain d'avocat, déposer les œufs.", "timer_min": None},
        ],
        "plating_tip": "Piment d'Espelette et ciboulette fraîche sur le dessus.",
        "tiktok_pool": TIKTOK_BREAKFAST,
    },
    {
        "sub": "sale",
        "name": "Omelette blanche thon & légumes",
        "description": "Omelette légère hyper protéinée pour ceux qui cherchent le volume.",
        "calories": 310, "protein": 40, "carbs": 5, "fat": 12,
        "prep_time_min": 10, "difficulty": "facile",
        "image": "eggs",
        "tags": ["omelette", "thon", "protéines", "light"],
        "ingredients": [
            {"name": "Blanc d'œuf", "quantity_g": 200, "unit": "g"},
            {"name": "Œuf entier", "quantity_g": 50, "unit": "g"},
            {"name": "Thon en boîte au naturel", "quantity_g": 100, "unit": "g"},
            {"name": "Épinards frais", "quantity_g": 40, "unit": "g"},
            {"name": "Tomates cerises", "quantity_g": 50, "unit": "g"},
            {"name": "Herbes de Provence", "quantity_g": 2, "unit": "g"},
        ],
        "steps": [
            {"text": "Fouetter les blancs et l'œuf entier.", "timer_min": None},
            {"text": "Faire revenir les épinards 2 min à la poêle.", "timer_min": 2},
            {"text": "Verser l'œuf, ajouter thon, légumes et herbes.", "timer_min": None},
            {"text": "Plier et cuire encore 2-3 min.", "timer_min": 3},
        ],
        "plating_tip": "Servir avec une sauce sriracha légère.",
        "tiktok_pool": TIKTOK_BREAKFAST,
    },
    {
        "sub": "sale",
        "name": "Wraps petit déj saumon fumé & fromage frais",
        "description": "Wraps express froids, parfaits pour le matin pressé.",
        "calories": 380, "protein": 28, "carbs": 32, "fat": 14,
        "prep_time_min": 5, "difficulty": "facile",
        "image": "toast",
        "tags": ["wrap", "saumon", "fromage-frais", "express"],
        "ingredients": [
            {"name": "Tortilla complète", "quantity_g": 60, "unit": "g"},
            {"name": "Saumon fumé", "quantity_g": 80, "unit": "g"},
            {"name": "Fromage frais type Philadelphia light", "quantity_g": 40, "unit": "g"},
            {"name": "Concombre", "quantity_g": 50, "unit": "g"},
            {"name": "Aneth frais", "quantity_g": 5, "unit": "g"},
            {"name": "Jus de citron", "quantity_g": 5, "unit": "ml"},
        ],
        "steps": [
            {"text": "Étaler le fromage frais sur la tortilla.", "timer_min": None},
            {"text": "Disposer le saumon, le concombre en fines tranches et l'aneth.", "timer_min": None},
            {"text": "Arroser de citron, rouler serré.", "timer_min": None},
        ],
        "plating_tip": "Couper en biais et servir avec une salade verte.",
        "tiktok_pool": TIKTOK_BREAKFAST,
    },
    {
        "sub": "sale",
        "name": "Bowl petit déj poulet & œuf poché",
        "description": "Bowl salé power pour les journées sportives intenses.",
        "calories": 480, "protein": 45, "carbs": 30, "fat": 16,
        "prep_time_min": 15, "difficulty": "moyen",
        "image": "eggs",
        "tags": ["bowl", "poulet", "œuf", "power"],
        "ingredients": [
            {"name": "Blanc de poulet cuit", "quantity_g": 130, "unit": "g"},
            {"name": "Riz brun cuit", "quantity_g": 120, "unit": "g"},
            {"name": "Œuf", "quantity_g": 55, "unit": "g"},
            {"name": "Épinards", "quantity_g": 40, "unit": "g"},
            {"name": "Sauce soja légère", "quantity_g": 15, "unit": "ml"},
            {"name": "Graines de sésame", "quantity_g": 5, "unit": "g"},
        ],
        "steps": [
            {"text": "Réchauffer le riz et le poulet.", "timer_min": 3},
            {"text": "Pocher l'œuf dans l'eau frémissante vinaigrée 3 min.", "timer_min": 3},
            {"text": "Disposer riz, poulet, épinards dans le bowl.", "timer_min": None},
            {"text": "Déposer l'œuf poché, arroser de sauce soja et sésame.", "timer_min": None},
        ],
        "plating_tip": "Percer le jaune à table pour l'effet visuel.",
        "tiktok_pool": TIKTOK_BREAKFAST,
    },
    # ── Smoothies & Boissons ───────────────────────────────────────────────────
    {
        "sub": "smoothie",
        "name": "Smoothie protéiné fraise & banane",
        "description": "Smoothie épais et onctueux, prêt en 2 minutes.",
        "calories": 320, "protein": 28, "carbs": 38, "fat": 4,
        "prep_time_min": 3, "difficulty": "facile",
        "image": "smoothie",
        "tags": ["smoothie", "fraise", "protéines", "express"],
        "ingredients": [
            {"name": "Fraises surgelées", "quantity_g": 150, "unit": "g"},
            {"name": "Banane", "quantity_g": 80, "unit": "g"},
            {"name": "Protéine fraise ou vanille", "quantity_g": 30, "unit": "g"},
            {"name": "Lait écrémé", "quantity_g": 150, "unit": "ml"},
            {"name": "Graines de chia", "quantity_g": 8, "unit": "g"},
        ],
        "steps": [
            {"text": "Tout mettre dans le blender.", "timer_min": None},
            {"text": "Mixer 45 secondes jusqu'à texture lisse.", "timer_min": 1},
            {"text": "Servir immédiatement.", "timer_min": None},
        ],
        "plating_tip": "Quelques fraises fraîches et chia sur le dessus.",
        "tiktok_pool": TIKTOK_BREAKFAST,
    },
    {
        "sub": "smoothie",
        "name": "Green smoothie épinard & mangue",
        "description": "Vert mais sucré — idéal pour faire manger des légumes sans y goûter.",
        "calories": 280, "protein": 18, "carbs": 44, "fat": 3,
        "prep_time_min": 3, "difficulty": "facile",
        "image": "smoothie",
        "tags": ["green-smoothie", "épinards", "mangue", "vitaminé"],
        "ingredients": [
            {"name": "Épinards frais", "quantity_g": 60, "unit": "g"},
            {"name": "Mangue surgelée", "quantity_g": 120, "unit": "g"},
            {"name": "Banane", "quantity_g": 60, "unit": "g"},
            {"name": "Protéine vanille", "quantity_g": 20, "unit": "g"},
            {"name": "Lait de coco light", "quantity_g": 150, "unit": "ml"},
            {"name": "Gingembre frais", "quantity_g": 5, "unit": "g"},
        ],
        "steps": [
            {"text": "Mixer épinards et lait de coco en premier.", "timer_min": None},
            {"text": "Ajouter mangue, banane, protéine et gingembre.", "timer_min": None},
            {"text": "Mixer 1 min jusqu'à texture parfaitement lisse.", "timer_min": 1},
        ],
        "plating_tip": "Décorer de feuilles de menthe.",
        "tiktok_pool": TIKTOK_BREAKFAST,
    },
    {
        "sub": "smoothie",
        "name": "Smoothie bowl myrtille & granola",
        "description": "Plus épais qu'un smoothie, à manger avec une cuillère.",
        "calories": 390, "protein": 20, "carbs": 55, "fat": 8,
        "prep_time_min": 5, "difficulty": "facile",
        "image": "smoothie",
        "tags": ["smoothie-bowl", "myrtille", "granola", "healthy"],
        "ingredients": [
            {"name": "Myrtilles surgelées", "quantity_g": 150, "unit": "g"},
            {"name": "Banane surgelée", "quantity_g": 80, "unit": "g"},
            {"name": "Yaourt grec 0%", "quantity_g": 100, "unit": "g"},
            {"name": "Protéine vanille", "quantity_g": 20, "unit": "g"},
            {"name": "Granola", "quantity_g": 35, "unit": "g"},
            {"name": "Noix de coco râpée", "quantity_g": 10, "unit": "g"},
        ],
        "steps": [
            {"text": "Mixer myrtilles, banane et yaourt en base épaisse.", "timer_min": None},
            {"text": "Ajouter la protéine, mixer brièvement.", "timer_min": None},
            {"text": "Verser dans un bol et garnir de granola et coco.", "timer_min": None},
        ],
        "plating_tip": "Créer des rangées nettes de toppings pour un beau visuel.",
        "tiktok_pool": TIKTOK_BREAKFAST,
    },
]

SNACK_RECIPES = [
    # ── Sucré sain ────────────────────────────────────────────────────────────
    {
        "sub": "snack_sucre",
        "name": "Energy balls chocolat & dattes",
        "description": "Boules d'énergie sans cuisson à préparer le dimanche.",
        "calories": 180, "protein": 6, "carbs": 28, "fat": 6,
        "prep_time_min": 15, "difficulty": "facile",
        "image": "bar",
        "tags": ["energy-ball", "chocolat", "dattes", "meal-prep"],
        "ingredients": [
            {"name": "Dattes Medjool dénoyautées", "quantity_g": 100, "unit": "g"},
            {"name": "Flocons d'avoine", "quantity_g": 60, "unit": "g"},
            {"name": "Cacao en poudre", "quantity_g": 15, "unit": "g"},
            {"name": "Beurre de cacahuète", "quantity_g": 30, "unit": "g"},
            {"name": "Graines de chia", "quantity_g": 10, "unit": "g"},
        ],
        "steps": [
            {"text": "Mixer dattes, cacao et beurre de cacahuète au robot.", "timer_min": None},
            {"text": "Ajouter flocons et chia, mixer brièvement (texture granuleuse ok).", "timer_min": None},
            {"text": "Former des boules de ~25g et réfrigérer 30 min.", "timer_min": 30},
        ],
        "plating_tip": "Rouler dans du cacao ou de la noix de coco râpée.",
        "tiktok_pool": TIKTOK_SNACK,
    },
    {
        "sub": "snack_sucre",
        "name": "Muffins protéinés myrtilles & avoine",
        "description": "Muffins moelleux faibles en sucre ajouté, batch cooking idéal.",
        "calories": 160, "protein": 10, "carbs": 20, "fat": 4,
        "prep_time_min": 20, "difficulty": "facile",
        "image": "muffin",
        "tags": ["muffin", "myrtille", "protéines", "meal-prep"],
        "ingredients": [
            {"name": "Flocons d'avoine mixés", "quantity_g": 80, "unit": "g"},
            {"name": "Banane mûre", "quantity_g": 100, "unit": "g"},
            {"name": "Blanc d'œuf", "quantity_g": 60, "unit": "g"},
            {"name": "Yaourt grec 0%", "quantity_g": 80, "unit": "g"},
            {"name": "Myrtilles fraîches", "quantity_g": 60, "unit": "g"},
            {"name": "Levure chimique", "quantity_g": 5, "unit": "g"},
            {"name": "Extrait de vanille", "quantity_g": 3, "unit": "ml"},
        ],
        "steps": [
            {"text": "Préchauffer à 175°C.", "timer_min": None},
            {"text": "Écraser la banane, mélanger avec yaourt, blancs, vanille.", "timer_min": None},
            {"text": "Incorporer farine d'avoine et levure.", "timer_min": None},
            {"text": "Plier les myrtilles délicatement.", "timer_min": None},
            {"text": "Remplir les moules aux 2/3, cuire 18-20 min.", "timer_min": 20},
        ],
        "plating_tip": "Quelques myrtilles posées sur le dessus avant cuisson.",
        "tiktok_pool": TIKTOK_SNACK,
    },
    {
        "sub": "snack_sucre",
        "name": "Banane rôtie au miel & cannelle",
        "description": "Collation chaude réconfortante en 5 minutes.",
        "calories": 150, "protein": 2, "carbs": 36, "fat": 1,
        "prep_time_min": 5, "difficulty": "facile",
        "image": "fruit",
        "tags": ["banane", "miel", "chaud", "express"],
        "ingredients": [
            {"name": "Banane", "quantity_g": 120, "unit": "g"},
            {"name": "Miel", "quantity_g": 10, "unit": "g"},
            {"name": "Cannelle", "quantity_g": 1, "unit": "g"},
            {"name": "Yaourt grec 0%", "quantity_g": 80, "unit": "g"},
        ],
        "steps": [
            {"text": "Couper la banane en deux dans la longueur.", "timer_min": None},
            {"text": "Poêler 2 min côté coupé avec le miel et la cannelle.", "timer_min": 2},
            {"text": "Servir chaud avec le yaourt grec.", "timer_min": None},
        ],
        "plating_tip": "Un trait de miel supplémentaire et une pincée de cannelle.",
        "tiktok_pool": TIKTOK_SNACK,
    },
    # ── Salé sain ─────────────────────────────────────────────────────────────
    {
        "sub": "snack_sale",
        "name": "Houmous maison & légumes croquants",
        "description": "Trempette protéinée express à base de pois chiches.",
        "calories": 200, "protein": 9, "carbs": 22, "fat": 8,
        "prep_time_min": 10, "difficulty": "facile",
        "image": "hummus",
        "tags": ["houmous", "légumes", "végétarien", "healthy"],
        "ingredients": [
            {"name": "Pois chiches en boîte", "quantity_g": 150, "unit": "g"},
            {"name": "Tahini", "quantity_g": 20, "unit": "g"},
            {"name": "Citron", "quantity_g": 15, "unit": "ml"},
            {"name": "Ail", "quantity_g": 5, "unit": "g"},
            {"name": "Carottes", "quantity_g": 80, "unit": "g"},
            {"name": "Concombre", "quantity_g": 60, "unit": "g"},
            {"name": "Paprika fumé", "quantity_g": 2, "unit": "g"},
        ],
        "steps": [
            {"text": "Mixer pois chiches, tahini, citron et ail avec 2-3 cs d'eau.", "timer_min": None},
            {"text": "Assaisonner, mixer jusqu'à texture crémeuse.", "timer_min": None},
            {"text": "Tailler carottes et concombre en bâtonnets.", "timer_min": None},
        ],
        "plating_tip": "Creuser un puit dans le houmous, y verser un trait d'huile d'olive et le paprika.",
        "tiktok_pool": TIKTOK_SNACK,
    },
    {
        "sub": "snack_sale",
        "name": "Crackers riz fromage blanc & concombre",
        "description": "Collation légère et rassasiante 3 ingrédients.",
        "calories": 160, "protein": 12, "carbs": 18, "fat": 3,
        "prep_time_min": 5, "difficulty": "facile",
        "image": "cheese",
        "tags": ["crackers", "fromage-blanc", "light", "express"],
        "ingredients": [
            {"name": "Galettes de riz", "quantity_g": 30, "unit": "g"},
            {"name": "Fromage blanc 0%", "quantity_g": 100, "unit": "g"},
            {"name": "Concombre", "quantity_g": 80, "unit": "g"},
            {"name": "Aneth séché", "quantity_g": 2, "unit": "g"},
            {"name": "Sel, poivre", "quantity_g": 1, "unit": "g"},
        ],
        "steps": [
            {"text": "Assaisonner le fromage blanc avec l'aneth, sel et poivre.", "timer_min": None},
            {"text": "Trancher finement le concombre.", "timer_min": None},
            {"text": "Tartiner les galettes et garnir de concombre.", "timer_min": None},
        ],
        "plating_tip": "Ajouter quelques graines de sésame pour le croquant.",
        "tiktok_pool": TIKTOK_SNACK,
    },
    {
        "sub": "snack_sale",
        "name": "Chips de pois chiches épicées au four",
        "description": "Alternative healthy aux chips avec 3x plus de protéines.",
        "calories": 190, "protein": 10, "carbs": 26, "fat": 5,
        "prep_time_min": 30, "difficulty": "facile",
        "image": "nuts",
        "tags": ["pois-chiches", "chips", "épicé", "meal-prep"],
        "ingredients": [
            {"name": "Pois chiches en boîte égouttés", "quantity_g": 200, "unit": "g"},
            {"name": "Huile d'olive", "quantity_g": 10, "unit": "ml"},
            {"name": "Paprika fumé", "quantity_g": 3, "unit": "g"},
            {"name": "Cumin", "quantity_g": 2, "unit": "g"},
            {"name": "Sel", "quantity_g": 2, "unit": "g"},
        ],
        "steps": [
            {"text": "Préchauffer le four à 200°C.", "timer_min": None},
            {"text": "Sécher soigneusement les pois chiches.", "timer_min": None},
            {"text": "Mélanger avec huile et épices, étaler sur plaque.", "timer_min": None},
            {"text": "Cuire 25-30 min en remuant à mi-cuisson.", "timer_min": 30},
        ],
        "plating_tip": "Servir chaud ou laisser refroidir pour plus de croquant.",
        "tiktok_pool": TIKTOK_SNACK,
    },
    # ── Sain / Fruits ─────────────────────────────────────────────────────────
    {
        "sub": "snack_sain",
        "name": "Yaourt grec, miel & fruits rouges",
        "description": "La collation la plus simple et efficace du monde.",
        "calories": 180, "protein": 15, "carbs": 22, "fat": 2,
        "prep_time_min": 2, "difficulty": "facile",
        "image": "yogurt",
        "tags": ["yaourt", "fruits-rouges", "express", "protéines"],
        "ingredients": [
            {"name": "Yaourt grec 0%", "quantity_g": 150, "unit": "g"},
            {"name": "Fraises", "quantity_g": 80, "unit": "g"},
            {"name": "Framboises", "quantity_g": 40, "unit": "g"},
            {"name": "Miel", "quantity_g": 10, "unit": "g"},
            {"name": "Granola", "quantity_g": 20, "unit": "g"},
        ],
        "steps": [
            {"text": "Verser le yaourt dans un bol.", "timer_min": None},
            {"text": "Disposer les fruits et le granola.", "timer_min": None},
            {"text": "Arroser de miel.", "timer_min": None},
        ],
        "plating_tip": "Quelques feuilles de menthe pour la fraîcheur.",
        "tiktok_pool": TIKTOK_SNACK,
    },
    {
        "sub": "snack_sain",
        "name": "Mix de noix & fruits secs anti-fringale",
        "description": "Le snack parfait à emporter partout, sans préparation.",
        "calories": 210, "protein": 6, "carbs": 18, "fat": 13,
        "prep_time_min": 2, "difficulty": "facile",
        "image": "nuts",
        "tags": ["noix", "fruits-secs", "express", "sain"],
        "ingredients": [
            {"name": "Amandes nature", "quantity_g": 20, "unit": "g"},
            {"name": "Noix de cajou", "quantity_g": 15, "unit": "g"},
            {"name": "Noix", "quantity_g": 10, "unit": "g"},
            {"name": "Abricots secs", "quantity_g": 20, "unit": "g"},
            {"name": "Canneberges séchées", "quantity_g": 15, "unit": "g"},
        ],
        "steps": [
            {"text": "Mélanger tous les ingrédients dans un petit pot.", "timer_min": None},
            {"text": "Préparer plusieurs portions à l'avance.", "timer_min": None},
        ],
        "plating_tip": "Idéal dans une petite boîte hermétique.",
        "tiktok_pool": TIKTOK_SNACK,
    },
    {
        "sub": "snack_sain",
        "name": "Pomme beurre de cacahuète",
        "description": "Classique indestructible, satiétant et délicieux.",
        "calories": 200, "protein": 5, "carbs": 30, "fat": 8,
        "prep_time_min": 2, "difficulty": "facile",
        "image": "fruit",
        "tags": ["pomme", "beurre-cacahuète", "express", "sain"],
        "ingredients": [
            {"name": "Pomme", "quantity_g": 150, "unit": "g"},
            {"name": "Beurre de cacahuète naturel", "quantity_g": 25, "unit": "g"},
            {"name": "Cannelle", "quantity_g": 1, "unit": "g"},
        ],
        "steps": [
            {"text": "Trancher la pomme en quartiers.", "timer_min": None},
            {"text": "Servir avec le beurre de cacahuète pour tremper.", "timer_min": None},
            {"text": "Saupoudrer de cannelle.", "timer_min": None},
        ],
        "plating_tip": "Arroser légèrement de citron pour éviter l'oxydation.",
        "tiktok_pool": TIKTOK_SNACK,
    },
    # ── Sport & Performance ───────────────────────────────────────────────────
    {
        "sub": "snack_sport",
        "name": "Shake protéiné maison post-workout",
        "description": "À prendre dans les 30 min après l'entraînement.",
        "calories": 280, "protein": 35, "carbs": 24, "fat": 4,
        "prep_time_min": 2, "difficulty": "facile",
        "image": "protein",
        "tags": ["shake", "protéines", "post-workout", "express"],
        "ingredients": [
            {"name": "Protéine whey chocolat", "quantity_g": 40, "unit": "g"},
            {"name": "Lait écrémé", "quantity_g": 200, "unit": "ml"},
            {"name": "Banane", "quantity_g": 60, "unit": "g"},
            {"name": "Cacao en poudre", "quantity_g": 5, "unit": "g"},
        ],
        "steps": [
            {"text": "Tout mettre dans le shaker ou blender.", "timer_min": None},
            {"text": "Mixer ou secouer vigoureusement.", "timer_min": None},
            {"text": "Consommer immédiatement.", "timer_min": None},
        ],
        "plating_tip": "Ajouter des glaçons pour une texture plus froide.",
        "tiktok_pool": TIKTOK_SNACK,
    },
    {
        "sub": "snack_sport",
        "name": "Barre protéinée maison avoine & chocolat",
        "description": "Barres à préparer le dimanche, 6 barres pour la semaine.",
        "calories": 220, "protein": 14, "carbs": 28, "fat": 6,
        "prep_time_min": 20, "difficulty": "facile",
        "image": "bar",
        "tags": ["barre", "protéines", "meal-prep", "chocolat"],
        "ingredients": [
            {"name": "Flocons d'avoine", "quantity_g": 120, "unit": "g"},
            {"name": "Protéine chocolat", "quantity_g": 60, "unit": "g"},
            {"name": "Beurre de cacahuète", "quantity_g": 60, "unit": "g"},
            {"name": "Miel", "quantity_g": 40, "unit": "g"},
            {"name": "Pépites de chocolat noir", "quantity_g": 30, "unit": "g"},
            {"name": "Lait écrémé", "quantity_g": 40, "unit": "ml"},
        ],
        "steps": [
            {"text": "Chauffer beurre de cacahuète et miel à feu doux.", "timer_min": 2},
            {"text": "Hors du feu, incorporer protéine, flocons et lait.", "timer_min": None},
            {"text": "Ajouter les pépites, étaler dans un moule.", "timer_min": None},
            {"text": "Réfrigérer 2h puis couper en 6 barres.", "timer_min": None},
        ],
        "plating_tip": "Emballer chaque barre dans du film alimentaire.",
        "tiktok_pool": TIKTOK_SNACK,
    },
    {
        "sub": "snack_sport",
        "name": "Cottage cheese & ananas pre-workout",
        "description": "Snack pré-entraînement : protéines lentes + sucres rapides.",
        "calories": 190, "protein": 20, "carbs": 22, "fat": 2,
        "prep_time_min": 3, "difficulty": "facile",
        "image": "yogurt",
        "tags": ["cottage", "ananas", "pre-workout", "protéines"],
        "ingredients": [
            {"name": "Cottage cheese", "quantity_g": 150, "unit": "g"},
            {"name": "Ananas frais ou en boîte", "quantity_g": 80, "unit": "g"},
            {"name": "Graines de lin", "quantity_g": 8, "unit": "g"},
            {"name": "Miel", "quantity_g": 8, "unit": "g"},
        ],
        "steps": [
            {"text": "Verser le cottage cheese dans un bol.", "timer_min": None},
            {"text": "Ajouter l'ananas coupé en morceaux.", "timer_min": None},
            {"text": "Saupoudrer de graines de lin et arroser de miel.", "timer_min": None},
        ],
        "plating_tip": "Parfait 45-60 min avant l'entraînement.",
        "tiktok_pool": TIKTOK_SNACK,
    },
    {
        "sub": "snack_sport",
        "name": "Riz au lait protéiné vanille",
        "description": "Classique revisité fitness, idéal en post-workout doux.",
        "calories": 310, "protein": 22, "carbs": 42, "fat": 4,
        "prep_time_min": 20, "difficulty": "facile",
        "image": "oats",
        "tags": ["riz-au-lait", "protéines", "post-workout", "réconfort"],
        "ingredients": [
            {"name": "Riz rond", "quantity_g": 60, "unit": "g"},
            {"name": "Lait écrémé", "quantity_g": 300, "unit": "ml"},
            {"name": "Protéine vanille", "quantity_g": 25, "unit": "g"},
            {"name": "Extrait de vanille", "quantity_g": 3, "unit": "ml"},
            {"name": "Édulcorant ou miel", "quantity_g": 10, "unit": "g"},
        ],
        "steps": [
            {"text": "Porter le lait à frémissement, ajouter le riz.", "timer_min": None},
            {"text": "Cuire à feu doux 18-20 min en remuant.", "timer_min": 20},
            {"text": "Hors du feu, incorporer la protéine et la vanille.", "timer_min": None},
            {"text": "Ajuster la sucrosité selon les goûts.", "timer_min": None},
        ],
        "plating_tip": "Saupoudrer de cannelle et servir tiède.",
        "tiktok_pool": TIKTOK_SNACK,
    },
]


async def main():
    async with AsyncSessionLocal() as db:
        # ── 1. Créer catégorie Petit Déjeuner si absente ────────────────────
        existing_cats = (await db.execute(
            text("SELECT id::text FROM recipe_categories WHERE id::text IN (:b, :s)"),
            {"b": CAT_BREAKFAST_ID, "s": CAT_SNACK_ID}
        )).all()
        existing_ids = {str(r.id) for r in existing_cats}

        if CAT_BREAKFAST_ID not in existing_ids:
            await db.execute(text("""
                INSERT INTO recipe_categories (id, slug, name, emoji, "order")
                VALUES (CAST(:id AS uuid), :slug, :name, :emoji, :order)
            """), {"id": CAT_BREAKFAST_ID, "slug": "petit-dejeuner", "name": "Petit Déjeuner", "emoji": "🌅", "order": 10})
            print("✓ Catégorie Petit Déjeuner créée")

        if CAT_SNACK_ID not in existing_ids:
            await db.execute(text("""
                INSERT INTO recipe_categories (id, slug, name, emoji, "order")
                VALUES (CAST(:id AS uuid), :slug, :name, :emoji, :order)
            """), {"id": CAT_SNACK_ID, "slug": "collation", "name": "Collation", "emoji": "🍎", "order": 11})
            print("✓ Catégorie Collation créée")

        # ── 2. Créer sous-catégories ────────────────────────────────────────
        subcats = [
            (SUB_IDS["sucre"],       "Sucré & Gourmand",    CAT_BREAKFAST_ID),
            (SUB_IDS["sale"],        "Salé & Protéiné",     CAT_BREAKFAST_ID),
            (SUB_IDS["smoothie"],    "Smoothies & Bowls",   CAT_BREAKFAST_ID),
            (SUB_IDS["oats"],        "Oats & Céréales",     CAT_BREAKFAST_ID),
            (SUB_IDS["snack_sucre"], "Sucré & Énergisant",  CAT_SNACK_ID),
            (SUB_IDS["snack_sale"],  "Salé & Rassasiant",   CAT_SNACK_ID),
            (SUB_IDS["snack_sain"],  "Fruits & Nature",     CAT_SNACK_ID),
            (SUB_IDS["snack_sport"], "Sport & Performance", CAT_SNACK_ID),
        ]
        # reverse map key from id
        sub_key_by_id = {v: k for k, v in SUB_IDS.items()}

        existing_subs = {str(r.id) for r in (await db.execute(
            text("SELECT id::text FROM recipe_subcategories WHERE category_id::text IN (:b, :s)"),
            {"b": CAT_BREAKFAST_ID, "s": CAT_SNACK_ID}
        )).all()}

        for sub_id, sub_name, cat_id in subcats:
            if sub_id not in existing_subs:
                key = sub_key_by_id[sub_id]
                slug, emoji = SUB_SLUGS[key]
                await db.execute(text("""
                    INSERT INTO recipe_subcategories (id, slug, name, emoji, category_id)
                    VALUES (CAST(:id AS uuid), :slug, :name, :emoji, CAST(:cat_id AS uuid))
                """), {"id": sub_id, "slug": slug, "name": sub_name, "emoji": emoji, "cat_id": cat_id})

        print("✓ Sous-catégories créées")

        # ── 3. Insérer les recettes ─────────────────────────────────────────
        import json as _json
        all_recipes = [
            *[(r, "breakfast") for r in BREAKFAST_RECIPES],
            *[(r, "snack") for r in SNACK_RECIPES],
        ]

        pool_map = {
            "breakfast": TIKTOK_BREAKFAST,
            "snack": TIKTOK_SNACK,
        }
        counters = {"breakfast": 0, "snack": 0}

        count = 0
        for recipe_data, rtype in all_recipes:
            pool = pool_map[rtype]
            i = counters[rtype]
            handle, creator_name, vid_id = pool[i % len(pool)]
            counters[rtype] += 1
            tiktok_url = f"https://www.tiktok.com/{handle}/video/{vid_id}"

            sub_key = recipe_data["sub"]
            sub_id = SUB_IDS[sub_key]

            recipe_id = str(uuid.uuid4())
            await db.execute(text("""
                INSERT INTO recipes (
                    id, subcategory_id, name, description,
                    calories, protein, carbs, fat,
                    prep_time_min, difficulty,
                    ingredients, steps,
                    creator_handle, creator_name, tiktok_url, tiktok_video_id,
                    image_urls, tags, plating_tip,
                    likes_count, saves_count
                ) VALUES (
                    CAST(:id AS uuid), CAST(:subcategory_id AS uuid), :name, :description,
                    :calories, :protein, :carbs, :fat,
                    :prep_time_min, :difficulty,
                    CAST(:ingredients AS json), CAST(:steps AS json),
                    :creator_handle, :creator_name, :tiktok_url, :tiktok_video_id,
                    CAST(:image_urls AS json), :tags, :plating_tip,
                    :likes_count, :saves_count
                )
                ON CONFLICT DO NOTHING
            """), {
                "id": recipe_id,
                "subcategory_id": sub_id,
                "name": recipe_data["name"],
                "description": recipe_data.get("description", ""),
                "calories": recipe_data["calories"],
                "protein": recipe_data["protein"],
                "carbs": recipe_data["carbs"],
                "fat": recipe_data["fat"],
                "prep_time_min": recipe_data["prep_time_min"],
                "difficulty": recipe_data["difficulty"],
                "ingredients": _json.dumps(recipe_data["ingredients"], ensure_ascii=False),
                "steps": _json.dumps(recipe_data["steps"], ensure_ascii=False),
                "creator_handle": handle,
                "creator_name": creator_name,
                "tiktok_url": tiktok_url,
                "tiktok_video_id": vid_id,
                "image_urls": _json.dumps([IMAGES.get(recipe_data["image"], IMAGES["default"])], ensure_ascii=False),
                "tags": recipe_data["tags"],  # pass as Python list — SQLAlchemy maps to PG array
                "plating_tip": recipe_data.get("plating_tip", ""),
                "likes_count": 0,
                "saves_count": 0,
            })
            count += 1

        await db.commit()
        print(f"✓ {count} recettes insérées (petit déjeuner + collation)")

        # ── Résumé ──────────────────────────────────────────────────────────
        total = (await db.execute(text("SELECT COUNT(*) FROM recipes"))).scalar()
        print(f"✓ Total recettes en base : {total}")


asyncio.run(main())
