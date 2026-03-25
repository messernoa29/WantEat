"""Seed the recipe library. Run with: docker compose exec backend python seed_library.py"""
import asyncio
import uuid

from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.db.models.library import Recipe, RecipeCategory, RecipeSubcategory

# ────────────────────────────────────────────────────────────────────
# Data
# ────────────────────────────────────────────────────────────────────

CATEGORIES = [
    {
        "slug": "poulet", "name": "Poulet", "emoji": "🍗", "order": 1,
        "description": "Blanc, cuisse, filet… le classique protéiné",
        "subcategories": [
            {"slug": "poulet-grille",  "name": "Grillé & Sec",      "emoji": "🔥", "order": 1},
            {"slug": "poulet-cremeux", "name": "Sauce Crémeuse",    "emoji": "🥛", "order": 2},
            {"slug": "poulet-asian",   "name": "Asian & Teriyaki",  "emoji": "🍜", "order": 3},
            {"slug": "poulet-epice",   "name": "Épicé & Mariné",    "emoji": "🌶️", "order": 4},
        ],
    },
    {
        "slug": "boeuf", "name": "Bœuf", "emoji": "🥩", "order": 2,
        "description": "Steak, burger, bolognaise…",
        "subcategories": [
            {"slug": "boeuf-steak",   "name": "Steaks & Classique",       "emoji": "🥩", "order": 1},
            {"slug": "boeuf-burger",  "name": "Burger & Street Food",     "emoji": "🍔", "order": 2},
            {"slug": "boeuf-mijote",  "name": "Mijotés & Bolognaise",     "emoji": "🫕", "order": 3},
        ],
    },
    {
        "slug": "porc", "name": "Porc", "emoji": "🐷", "order": 3,
        "description": "Filet, côte, caramel, ramen…",
        "subcategories": [
            {"slug": "porc-grille",      "name": "Grillé & Classique",     "emoji": "🔥", "order": 1},
            {"slug": "porc-sucre-sale",  "name": "Sucré-Salé & Caramel",   "emoji": "🍯", "order": 2},
            {"slug": "porc-asian",       "name": "Asian & Ramen",          "emoji": "🍜", "order": 3},
        ],
    },
    {
        "slug": "poisson", "name": "Poisson & Mer", "emoji": "🐟", "order": 4,
        "description": "Saumon, thon, crevettes…",
        "subcategories": [
            {"slug": "saumon",       "name": "Saumon",                    "emoji": "🐟", "order": 1},
            {"slug": "poisson-blanc","name": "Thon & Cabillaud",          "emoji": "🎣", "order": 2},
            {"slug": "fruits-mer",   "name": "Crevettes & Fruits de Mer", "emoji": "🦐", "order": 3},
        ],
    },
    {
        "slug": "bowls", "name": "Bowls", "emoji": "🥗", "order": 5,
        "description": "Le format TikTok par excellence",
        "subcategories": [
            {"slug": "bowl-proteine", "name": "Bowl Protéiné",    "emoji": "💪", "order": 1},
            {"slug": "bowl-vege",     "name": "Bowl Végétarien",  "emoji": "🌱", "order": 2},
            {"slug": "bowl-asian",    "name": "Bowl Asian",       "emoji": "🍱", "order": 3},
        ],
    },
    {
        "slug": "salades", "name": "Salades", "emoji": "🥙", "order": 6,
        "description": "Fraîches, repas, légères…",
        "subcategories": [
            {"slug": "salade-repas",   "name": "Salades Repas",           "emoji": "🥗", "order": 1},
            {"slug": "salade-fraiche", "name": "Salades Légères & Light",  "emoji": "🍋", "order": 2},
        ],
    },
    {
        "slug": "vege", "name": "Végétarien", "emoji": "🌱", "order": 7,
        "description": "Tofu, œufs, légumineuses…",
        "subcategories": [
            {"slug": "tofu",          "name": "Tofu & Tempeh",       "emoji": "🫘", "order": 1},
            {"slug": "oeufs",         "name": "Œufs & Fromage",      "emoji": "🍳", "order": 2},
            {"slug": "legumineuses",  "name": "Légumineuses & Curry", "emoji": "🍛", "order": 3},
        ],
    },
    {
        "slug": "feculents", "name": "Féculents", "emoji": "🍝", "order": 8,
        "description": "Pâtes, riz, patate douce…",
        "subcategories": [
            {"slug": "pates",  "name": "Pâtes & Gnocchis",             "emoji": "🍝", "order": 1},
            {"slug": "riz",    "name": "Riz & Risotto",                "emoji": "🍚", "order": 2},
            {"slug": "patate", "name": "Pomme de Terre & Patate Douce","emoji": "🍠", "order": 3},
        ],
    },
    {
        "slug": "sauces", "name": "Sauces", "emoji": "🥣", "order": 9,
        "description": "Les sauces qui font tout changer",
        "subcategories": [
            {"slug": "sauce-ail",       "name": "Ail & Umami",       "emoji": "🧄", "order": 1},
            {"slug": "sauce-sucree",    "name": "Sucrée-Salée",      "emoji": "🍯", "order": 2},
            {"slug": "sauce-epicee",    "name": "Épicée & Pimentée", "emoji": "🌶️", "order": 3},
            {"slug": "sauce-fraiche",   "name": "Fraîche & Citronnée","emoji": "🍋", "order": 4},
            {"slug": "sauce-asian",     "name": "Asian & Exotique",  "emoji": "🥢", "order": 5},
            {"slug": "sauce-base",      "name": "Bases Maison",      "emoji": "🫙", "order": 6},
        ],
    },
]

RECIPES = [
    # ── POULET GRILLÉ ──────────────────────────────────────────────
    {
        "subcategory_slug": "poulet-grille",
        "name": "Poulet grillé riz brocoli",
        "description": "Le classique bodybuilder revisité : simple, efficace, ultra-protéiné.",
        "calories": 480, "protein": 46, "carbs": 42, "fat": 10,
        "prep_time_min": 20, "difficulty": "facile",
        "ingredients": [
            {"name": "Blanc de poulet", "quantity_g": 200, "unit": "g"},
            {"name": "Riz blanc", "quantity_g": 80, "unit": "g (cru)"},
            {"name": "Brocoli", "quantity_g": 200, "unit": "g"},
            {"name": "Huile d'olive", "quantity_g": 10, "unit": "g"},
            {"name": "Paprika fumé", "quantity_g": 3, "unit": "g"},
        ],
        "steps": [
            "Cuire le riz selon les instructions du paquet.",
            "Assaisonner le poulet avec sel, poivre, paprika et un filet d'huile.",
            "Griller le poulet à feu vif 5 min de chaque côté.",
            "Cuire le brocoli vapeur 6 minutes.",
            "Assembler dans une assiette et servir chaud.",
        ],
    },
    {
        "subcategory_slug": "poulet-grille",
        "name": "Blanc de poulet 4 épices & patate douce",
        "description": "Protéiné et savoureux, parfait pour meal prep.",
        "calories": 510, "protein": 44, "carbs": 50, "fat": 9,
        "prep_time_min": 25, "difficulty": "facile",
        "ingredients": [
            {"name": "Blanc de poulet", "quantity_g": 200, "unit": "g"},
            {"name": "Patate douce", "quantity_g": 200, "unit": "g"},
            {"name": "Cumin, coriandre, paprika, curcuma", "quantity_g": 5, "unit": "g"},
            {"name": "Huile d'olive", "quantity_g": 10, "unit": "g"},
        ],
        "steps": [
            "Préchauffer le four à 200°C.",
            "Couper la patate douce en dés, enrober d'huile et épices, enfourner 20 min.",
            "Mariner le poulet avec les mêmes épices et griller à la poêle.",
            "Servir ensemble avec du persil frais.",
        ],
    },
    # ── POULET CRÉMEUX ────────────────────────────────────────────
    {
        "subcategory_slug": "poulet-cremeux",
        "name": "Poulet sauce moutarde & crème légère",
        "description": "La comfort food qui reste dans tes macros.",
        "calories": 520, "protein": 42, "carbs": 12, "fat": 30,
        "prep_time_min": 25, "difficulty": "facile",
        "ingredients": [
            {"name": "Blanc de poulet", "quantity_g": 180, "unit": "g"},
            {"name": "Crème légère 5%", "quantity_g": 100, "unit": "g"},
            {"name": "Moutarde à l'ancienne", "quantity_g": 20, "unit": "g"},
            {"name": "Échalote", "quantity_g": 30, "unit": "g"},
            {"name": "Thym frais", "quantity_g": 3, "unit": "g"},
        ],
        "steps": [
            "Poêler le poulet entier 5 min de chaque côté, réserver.",
            "Dans la même poêle, faire revenir l'échalote 2 min.",
            "Ajouter la crème et la moutarde, mélanger et chauffer 3 min.",
            "Remettre le poulet dans la sauce 5 min à feu doux.",
            "Servir avec du riz ou des pâtes.",
        ],
    },
    {
        "subcategory_slug": "poulet-cremeux",
        "name": "Poulet tikka masala light",
        "description": "La recette TikTok virale version fit : tomate, épices, crème coco.",
        "calories": 490, "protein": 40, "carbs": 28, "fat": 18,
        "prep_time_min": 30, "difficulty": "moyen",
        "ingredients": [
            {"name": "Blanc de poulet", "quantity_g": 180, "unit": "g"},
            {"name": "Tomates concassées", "quantity_g": 200, "unit": "g"},
            {"name": "Lait de coco allégé", "quantity_g": 100, "unit": "ml"},
            {"name": "Oignon", "quantity_g": 60, "unit": "g"},
            {"name": "Garam masala", "quantity_g": 5, "unit": "g"},
            {"name": "Ail & gingembre", "quantity_g": 10, "unit": "g"},
        ],
        "steps": [
            "Faire revenir l'oignon, l'ail et le gingembre 3 min.",
            "Ajouter le garam masala et cuire 1 min pour libérer les arômes.",
            "Ajouter les tomates concassées, cuire 10 min.",
            "Ajouter le lait de coco et le poulet coupé en morceaux.",
            "Mijoter 15 min. Servir avec du riz basmati.",
        ],
    },
    # ── POULET ASIAN ──────────────────────────────────────────────
    {
        "subcategory_slug": "poulet-asian",
        "name": "Bowl poulet teriyaki sésame",
        "description": "La recette TikTok la plus sauvegardée : sauce teriyaki maison, riz et edamame.",
        "calories": 540, "protein": 44, "carbs": 58, "fat": 11,
        "prep_time_min": 20, "difficulty": "facile",
        "ingredients": [
            {"name": "Blanc de poulet", "quantity_g": 180, "unit": "g"},
            {"name": "Riz japonais", "quantity_g": 80, "unit": "g (cru)"},
            {"name": "Sauce soja", "quantity_g": 30, "unit": "ml"},
            {"name": "Miel", "quantity_g": 15, "unit": "g"},
            {"name": "Sésame torréfié", "quantity_g": 5, "unit": "g"},
            {"name": "Edamame", "quantity_g": 50, "unit": "g"},
        ],
        "steps": [
            "Mélanger sauce soja, miel et 1 cc de fécule pour la sauce teriyaki.",
            "Poêler le poulet en morceaux 5 min, ajouter la sauce, caraméliser 3 min.",
            "Cuire le riz. Disposer dans un bowl avec edamame.",
            "Parsemer de sésame et de ciboulette.",
        ],
    },
    {
        "subcategory_slug": "poulet-asian",
        "name": "Brochettes yakitori poulet",
        "description": "Le classique japonais version BBQ ou grill maison.",
        "calories": 380, "protein": 38, "carbs": 18, "fat": 12,
        "prep_time_min": 25, "difficulty": "facile",
        "ingredients": [
            {"name": "Cuisse de poulet désossée", "quantity_g": 200, "unit": "g"},
            {"name": "Sauce soja", "quantity_g": 40, "unit": "ml"},
            {"name": "Mirin", "quantity_g": 20, "unit": "ml"},
            {"name": "Sucre", "quantity_g": 10, "unit": "g"},
            {"name": "Gingembre frais", "quantity_g": 5, "unit": "g"},
        ],
        "steps": [
            "Mélanger soja, mirin, sucre et gingembre râpé pour la marinade.",
            "Couper le poulet en cubes et faire mariner 30 min minimum.",
            "Embrocher et griller 4 min de chaque côté en badigeonnant de marinade.",
            "Servir avec du riz et du kimchi.",
        ],
    },
    # ── POULET ÉPICÉ ──────────────────────────────────────────────
    {
        "subcategory_slug": "poulet-epice",
        "name": "Poulet shawarma maison",
        "description": "Street food revisité à faire à la poêle, sans friture.",
        "calories": 460, "protein": 42, "carbs": 22, "fat": 20,
        "prep_time_min": 30, "difficulty": "moyen",
        "ingredients": [
            {"name": "Cuisse de poulet", "quantity_g": 200, "unit": "g"},
            {"name": "Cumin, paprika, curcuma, cannelle", "quantity_g": 8, "unit": "g"},
            {"name": "Yaourt grec", "quantity_g": 50, "unit": "g"},
            {"name": "Citron", "quantity_g": 30, "unit": "ml"},
            {"name": "Ail", "quantity_g": 5, "unit": "g"},
            {"name": "Pain pita", "quantity_g": 60, "unit": "g"},
        ],
        "steps": [
            "Mariner le poulet dans yaourt, épices, citron et ail au moins 1h.",
            "Cuire à la poêle ou au grill 6 min de chaque côté.",
            "Émincer finement et servir dans le pita avec salade et sauce tahini.",
        ],
    },
    {
        "subcategory_slug": "poulet-epice",
        "name": "Poulet cajun & avocat",
        "description": "Épicé, crémeux, rapide. Parfait entre 2 séances.",
        "calories": 500, "protein": 43, "carbs": 10, "fat": 30,
        "prep_time_min": 15, "difficulty": "facile",
        "ingredients": [
            {"name": "Blanc de poulet", "quantity_g": 180, "unit": "g"},
            {"name": "Épices cajun", "quantity_g": 8, "unit": "g"},
            {"name": "Avocat", "quantity_g": 80, "unit": "g"},
            {"name": "Citron vert", "quantity_g": 15, "unit": "ml"},
            {"name": "Huile de coco", "quantity_g": 10, "unit": "g"},
        ],
        "steps": [
            "Enrober le poulet d'épices cajun et d'huile.",
            "Griller à feu vif 5 min de chaque côté.",
            "Écraser l'avocat avec citron, sel et poivre.",
            "Servir le poulet sur l'avocat écrasé.",
        ],
    },

    # ── BŒUF STEAK ───────────────────────────────────────────────
    {
        "subcategory_slug": "boeuf-steak",
        "name": "Steak haricots verts & pomme de terre",
        "description": "Le repas fitness classique version brasserie française.",
        "calories": 560, "protein": 48, "carbs": 35, "fat": 22,
        "prep_time_min": 20, "difficulty": "facile",
        "ingredients": [
            {"name": "Steak de bœuf 5% MG", "quantity_g": 200, "unit": "g"},
            {"name": "Haricots verts", "quantity_g": 150, "unit": "g"},
            {"name": "Pomme de terre", "quantity_g": 150, "unit": "g"},
            {"name": "Beurre", "quantity_g": 10, "unit": "g"},
            {"name": "Thym, ail", "quantity_g": 5, "unit": "g"},
        ],
        "steps": [
            "Cuire les pommes de terre à la vapeur 15 min.",
            "Cuire les haricots verts 5 min dans l'eau bouillante salée.",
            "Poêler le steak avec beurre, thym et ail, 2-3 min de chaque côté.",
            "Laisser reposer 2 min avant de couper.",
        ],
    },
    {
        "subcategory_slug": "boeuf-steak",
        "name": "Pavé de bœuf & patate douce rôtie",
        "description": "Version moderne et colorée du steak classique.",
        "calories": 580, "protein": 50, "carbs": 42, "fat": 18,
        "prep_time_min": 30, "difficulty": "facile",
        "ingredients": [
            {"name": "Pavé de bœuf", "quantity_g": 180, "unit": "g"},
            {"name": "Patate douce", "quantity_g": 200, "unit": "g"},
            {"name": "Roquette", "quantity_g": 30, "unit": "g"},
            {"name": "Parmesan râpé", "quantity_g": 15, "unit": "g"},
        ],
        "steps": [
            "Rôtir la patate douce en dés à 200°C, 20 min.",
            "Saisir le pavé à feu très vif 2-3 min de chaque côté.",
            "Dresser : patate douce + roquette + pavé tranché + copeaux de parmesan.",
        ],
    },
    # ── BŒUF BURGER ──────────────────────────────────────────────
    {
        "subcategory_slug": "boeuf-burger",
        "name": "Smash burger double sauce spéciale",
        "description": "La recette TikTok qui a explosé les vues : steak écrasé, fromage fondu, sauce maison.",
        "calories": 680, "protein": 50, "carbs": 48, "fat": 28,
        "prep_time_min": 20, "difficulty": "moyen",
        "ingredients": [
            {"name": "Bœuf haché 15%", "quantity_g": 200, "unit": "g"},
            {"name": "Cheddar", "quantity_g": 30, "unit": "g"},
            {"name": "Brioche bun", "quantity_g": 80, "unit": "g"},
            {"name": "Oignon", "quantity_g": 50, "unit": "g"},
            {"name": "Cornichons, salade, tomate", "quantity_g": 80, "unit": "g"},
            {"name": "Sauce burger maison", "quantity_g": 30, "unit": "g"},
        ],
        "steps": [
            "Former 2 boules de 100g de bœuf haché.",
            "Chauffer la poêle à fond, poser les boules et écraser fort avec une spatule.",
            "Saler, cuire 2 min, retourner, poser le cheddar immédiatement.",
            "Couvrir 30s pour fondre. Assembler avec la sauce et les garnitures.",
        ],
    },
    {
        "subcategory_slug": "boeuf-burger",
        "name": "Burger fitness bœuf & guacamole",
        "description": "Burger sans culpabilité : bœuf maigre, pain complet, avocat.",
        "calories": 580, "protein": 46, "carbs": 40, "fat": 24,
        "prep_time_min": 20, "difficulty": "facile",
        "ingredients": [
            {"name": "Bœuf haché 5%", "quantity_g": 180, "unit": "g"},
            {"name": "Pain complet burger", "quantity_g": 70, "unit": "g"},
            {"name": "Avocat", "quantity_g": 80, "unit": "g"},
            {"name": "Tomate, laitue", "quantity_g": 60, "unit": "g"},
            {"name": "Moutarde", "quantity_g": 10, "unit": "g"},
        ],
        "steps": [
            "Mélanger le bœuf haché avec sel, poivre et une pincée d'ail en poudre.",
            "Former un steak et griller 3 min de chaque côté.",
            "Écraser l'avocat avec citron, sel et piment.",
            "Assembler dans le pain grillé.",
        ],
    },
    # ── BŒUF MIJOTÉ ──────────────────────────────────────────────
    {
        "subcategory_slug": "boeuf-mijote",
        "name": "Bolognaise protéinée",
        "description": "La sauce bolognaise classique revisitée avec du bœuf maigre.",
        "calories": 550, "protein": 48, "carbs": 50, "fat": 14,
        "prep_time_min": 35, "difficulty": "facile",
        "ingredients": [
            {"name": "Bœuf haché 5%", "quantity_g": 150, "unit": "g"},
            {"name": "Pâtes penne", "quantity_g": 80, "unit": "g (cru)"},
            {"name": "Tomates concassées", "quantity_g": 200, "unit": "g"},
            {"name": "Oignon, ail", "quantity_g": 60, "unit": "g"},
            {"name": "Basilic, origan", "quantity_g": 5, "unit": "g"},
        ],
        "steps": [
            "Faire revenir oignon et ail 3 min.",
            "Ajouter le bœuf haché, cuire 5 min en émiettant.",
            "Ajouter les tomates, herbes, sel, poivre. Mijoter 20 min.",
            "Cuire les pâtes al dente et mélanger avec la sauce.",
        ],
    },

    # ── PORC GRILLÉ ──────────────────────────────────────────────
    {
        "subcategory_slug": "porc-grille",
        "name": "Filet mignon porc & moutarde miel",
        "description": "Le morceau le plus maigre du porc, rôti parfaitement.",
        "calories": 450, "protein": 42, "carbs": 15, "fat": 20,
        "prep_time_min": 25, "difficulty": "facile",
        "ingredients": [
            {"name": "Filet mignon de porc", "quantity_g": 200, "unit": "g"},
            {"name": "Moutarde à l'ancienne", "quantity_g": 20, "unit": "g"},
            {"name": "Miel", "quantity_g": 15, "unit": "g"},
            {"name": "Romarin frais", "quantity_g": 3, "unit": "g"},
        ],
        "steps": [
            "Mélanger moutarde, miel et romarin.",
            "Badigeonner le filet mignon de cette préparation.",
            "Saisir à la poêle 2 min de chaque côté puis enfourner 15 min à 180°C.",
            "Laisser reposer 5 min avant de trancher.",
        ],
    },
    # ── PORC SUCRÉ-SALÉ ──────────────────────────────────────────
    {
        "subcategory_slug": "porc-sucre-sale",
        "name": "Porc caramel gingembre style asiatique",
        "description": "LA recette qui fait craquer tout le monde. Tendresse et caramel.",
        "calories": 520, "protein": 38, "carbs": 42, "fat": 18,
        "prep_time_min": 30, "difficulty": "moyen",
        "ingredients": [
            {"name": "Échine de porc", "quantity_g": 200, "unit": "g"},
            {"name": "Sauce soja", "quantity_g": 40, "unit": "ml"},
            {"name": "Sucre de canne", "quantity_g": 20, "unit": "g"},
            {"name": "Gingembre frais", "quantity_g": 10, "unit": "g"},
            {"name": "Ail", "quantity_g": 5, "unit": "g"},
            {"name": "Riz jasmin", "quantity_g": 80, "unit": "g (cru)"},
        ],
        "steps": [
            "Couper le porc en cubes de 3 cm.",
            "Faire fondre le sucre en caramel dans la poêle.",
            "Ajouter le porc et caraméliser 5 min.",
            "Ajouter soja, gingembre râpé et ail. Mijoter 15 min.",
            "Servir sur riz jasmin avec coriandre fraîche.",
        ],
    },
    {
        "subcategory_slug": "porc-sucre-sale",
        "name": "Côtes de porc miel soja & sésame",
        "description": "Laquées, brillantes, croustillantes. Le truc qui impressionne.",
        "calories": 580, "protein": 40, "carbs": 32, "fat": 28,
        "prep_time_min": 40, "difficulty": "moyen",
        "ingredients": [
            {"name": "Côtes de porc", "quantity_g": 250, "unit": "g"},
            {"name": "Miel", "quantity_g": 30, "unit": "g"},
            {"name": "Sauce soja", "quantity_g": 40, "unit": "ml"},
            {"name": "Sésame", "quantity_g": 5, "unit": "g"},
            {"name": "Ail en poudre", "quantity_g": 3, "unit": "g"},
        ],
        "steps": [
            "Mariner les côtes dans miel, soja et ail 30 min.",
            "Cuire au four 180°C 25 min, puis passer au grill 5 min pour dorer.",
            "Parsemer de sésame et servir avec pickles de concombre.",
        ],
    },
    # ── PORC ASIAN ────────────────────────────────────────────────
    {
        "subcategory_slug": "porc-asian",
        "name": "Ramen porc shoyu maison",
        "description": "Le ramen TikTok : bouillon soja, œuf mollet, porc effiloché.",
        "calories": 620, "protein": 42, "carbs": 60, "fat": 22,
        "prep_time_min": 45, "difficulty": "moyen",
        "ingredients": [
            {"name": "Filet de porc", "quantity_g": 150, "unit": "g"},
            {"name": "Nouilles ramen", "quantity_g": 80, "unit": "g (cru)"},
            {"name": "Bouillon de poulet", "quantity_g": 400, "unit": "ml"},
            {"name": "Sauce soja", "quantity_g": 30, "unit": "ml"},
            {"name": "Œuf", "quantity_g": 60, "unit": "g (1 œuf)"},
            {"name": "Algues nori, ciboulette", "quantity_g": 10, "unit": "g"},
        ],
        "steps": [
            "Cuire le filet de porc entier 20 min à feu doux dans l'eau + sauce soja.",
            "Faire l'œuf mollet : 6 min dans l'eau bouillante puis eau froide.",
            "Chauffer le bouillon avec la sauce soja.",
            "Cuire les nouilles, disposer dans le bol, ajouter bouillon, porc tranché et œuf coupé.",
        ],
    },

    # ── SAUMON ────────────────────────────────────────────────────
    {
        "subcategory_slug": "saumon",
        "name": "Saumon teriyaki & riz sushi",
        "description": "Le poke bowl version saumon chaud. Ultra instagrammable.",
        "calories": 560, "protein": 40, "carbs": 52, "fat": 18,
        "prep_time_min": 20, "difficulty": "facile",
        "ingredients": [
            {"name": "Pavé de saumon", "quantity_g": 180, "unit": "g"},
            {"name": "Riz sushi", "quantity_g": 80, "unit": "g (cru)"},
            {"name": "Sauce teriyaki", "quantity_g": 40, "unit": "ml"},
            {"name": "Avocat", "quantity_g": 60, "unit": "g"},
            {"name": "Concombre", "quantity_g": 50, "unit": "g"},
            {"name": "Sésame noir", "quantity_g": 5, "unit": "g"},
        ],
        "steps": [
            "Cuire le riz sushi selon le paquet.",
            "Poêler le saumon côté peau 4 min, retourner 2 min, verser la sauce teriyaki.",
            "Monter le bowl : riz, saumon laqué, avocat en tranches, concombre.",
            "Parsemer de sésame noir.",
        ],
    },
    {
        "subcategory_slug": "saumon",
        "name": "Saumon crustacés citron & aneth",
        "description": "Saumon au four en papillote : moelleux garanti.",
        "calories": 420, "protein": 38, "carbs": 5, "fat": 25,
        "prep_time_min": 20, "difficulty": "facile",
        "ingredients": [
            {"name": "Pavé de saumon", "quantity_g": 200, "unit": "g"},
            {"name": "Citron", "quantity_g": 30, "unit": "ml"},
            {"name": "Aneth frais", "quantity_g": 5, "unit": "g"},
            {"name": "Ail", "quantity_g": 5, "unit": "g"},
            {"name": "Câpres", "quantity_g": 10, "unit": "g"},
        ],
        "steps": [
            "Préchauffer le four à 180°C.",
            "Poser le saumon sur papier cuisson, ajouter citron, ail, câpres et aneth.",
            "Fermer la papillote et cuire 15 min.",
            "Servir avec des légumes verts ou une salade.",
        ],
    },
    # ── THON & CABILLAUD ─────────────────────────────────────────
    {
        "subcategory_slug": "poisson-blanc",
        "name": "Bowl thon & avocat façon poke",
        "description": "Le poke bowl facile sans cuisson : thon, avocat, mangue.",
        "calories": 480, "protein": 35, "carbs": 45, "fat": 16,
        "prep_time_min": 15, "difficulty": "facile",
        "ingredients": [
            {"name": "Thon en boîte au naturel", "quantity_g": 150, "unit": "g"},
            {"name": "Riz sushi cuit", "quantity_g": 150, "unit": "g"},
            {"name": "Avocat", "quantity_g": 80, "unit": "g"},
            {"name": "Mangue", "quantity_g": 60, "unit": "g"},
            {"name": "Sauce soja + sésame", "quantity_g": 20, "unit": "ml"},
        ],
        "steps": [
            "Disposer le riz au fond du bowl.",
            "Ajouter le thon égoutté, l'avocat et la mangue en dés.",
            "Arroser de sauce soja et parsemer de sésame.",
        ],
    },
    {
        "subcategory_slug": "poisson-blanc",
        "name": "Cabillaud poêlé sauce vierge",
        "description": "Poisson blanc ultra léger, sauce tomate fraîche à froid.",
        "calories": 320, "protein": 38, "carbs": 8, "fat": 12,
        "prep_time_min": 15, "difficulty": "facile",
        "ingredients": [
            {"name": "Dos de cabillaud", "quantity_g": 200, "unit": "g"},
            {"name": "Tomates cerises", "quantity_g": 100, "unit": "g"},
            {"name": "Basilic frais", "quantity_g": 5, "unit": "g"},
            {"name": "Citron", "quantity_g": 20, "unit": "ml"},
            {"name": "Huile d'olive", "quantity_g": 15, "unit": "g"},
        ],
        "steps": [
            "Préparer la sauce vierge : couper les tomates en 4, mélanger avec basilic, citron et huile.",
            "Saisir le cabillaud côté peau 3 min, retourner 2 min.",
            "Poser la sauce vierge par-dessus au moment de servir.",
        ],
    },
    # ── CREVETTES ─────────────────────────────────────────────────
    {
        "subcategory_slug": "fruits-mer",
        "name": "Crevettes sautées ail & persil",
        "description": "5 minutes top chrono, 30g de protéines. Le snack protéiné ultime.",
        "calories": 280, "protein": 30, "carbs": 5, "fat": 14,
        "prep_time_min": 10, "difficulty": "facile",
        "ingredients": [
            {"name": "Crevettes décortiquées", "quantity_g": 200, "unit": "g"},
            {"name": "Ail", "quantity_g": 10, "unit": "g"},
            {"name": "Persil frais", "quantity_g": 5, "unit": "g"},
            {"name": "Beurre", "quantity_g": 10, "unit": "g"},
            {"name": "Citron", "quantity_g": 15, "unit": "ml"},
        ],
        "steps": [
            "Faire fondre le beurre dans la poêle à feu vif.",
            "Ajouter l'ail haché 30s.",
            "Ajouter les crevettes, sauter 2-3 min jusqu'à coloration.",
            "Finir avec persil et citron.",
        ],
    },
    {
        "subcategory_slug": "fruits-mer",
        "name": "Crevettes curry coco & riz basmati",
        "description": "Curry de crevettes express : parfumé, léger, réconfortant.",
        "calories": 490, "protein": 32, "carbs": 52, "fat": 14,
        "prep_time_min": 20, "difficulty": "facile",
        "ingredients": [
            {"name": "Crevettes", "quantity_g": 180, "unit": "g"},
            {"name": "Lait de coco allégé", "quantity_g": 150, "unit": "ml"},
            {"name": "Curry en poudre", "quantity_g": 8, "unit": "g"},
            {"name": "Oignon, ail", "quantity_g": 60, "unit": "g"},
            {"name": "Riz basmati", "quantity_g": 80, "unit": "g (cru)"},
        ],
        "steps": [
            "Faire revenir oignon et ail, ajouter le curry.",
            "Ajouter le lait de coco, cuire 5 min.",
            "Ajouter les crevettes, cuire 3 min.",
            "Servir sur riz basmati avec coriandre.",
        ],
    },

    # ── BOWLS PROTÉINÉS ──────────────────────────────────────────
    {
        "subcategory_slug": "bowl-proteine",
        "name": "Power bowl quinoa poulet & avocat",
        "description": "Le bowl fitness parfait : quinoa complet, 40g de protéines, bon gras.",
        "calories": 580, "protein": 42, "carbs": 52, "fat": 18,
        "prep_time_min": 25, "difficulty": "facile",
        "ingredients": [
            {"name": "Blanc de poulet grillé", "quantity_g": 150, "unit": "g"},
            {"name": "Quinoa", "quantity_g": 80, "unit": "g (cru)"},
            {"name": "Avocat", "quantity_g": 80, "unit": "g"},
            {"name": "Pois chiches rôtis", "quantity_g": 60, "unit": "g"},
            {"name": "Roquette", "quantity_g": 30, "unit": "g"},
            {"name": "Sauce tahini citron", "quantity_g": 30, "unit": "ml"},
        ],
        "steps": [
            "Cuire le quinoa dans 2x son volume d'eau, 12 min.",
            "Rôtir les pois chiches au four 180°C 20 min avec huile et paprika.",
            "Assembler le bowl : quinoa + roquette + poulet + avocat + pois chiches.",
            "Finir avec sauce tahini.",
        ],
    },
    {
        "subcategory_slug": "bowl-proteine",
        "name": "Bowl bœuf champignons & œuf",
        "description": "Le bowl réconfort post-entraînement version japonaise.",
        "calories": 560, "protein": 46, "carbs": 45, "fat": 18,
        "prep_time_min": 20, "difficulty": "facile",
        "ingredients": [
            {"name": "Bœuf haché 5%", "quantity_g": 150, "unit": "g"},
            {"name": "Riz blanc", "quantity_g": 80, "unit": "g (cru)"},
            {"name": "Champignons shiitake", "quantity_g": 80, "unit": "g"},
            {"name": "Œuf", "quantity_g": 60, "unit": "g"},
            {"name": "Sauce soja, huile de sésame", "quantity_g": 20, "unit": "ml"},
        ],
        "steps": [
            "Cuire le riz. Poêler le bœuf avec champignons et sauce soja.",
            "Faire un œuf mollet (6 min) ou au plat.",
            "Assembler bowl : riz + bœuf + champignons + œuf.",
            "Finir avec huile de sésame et oignons verts.",
        ],
    },
    # ── BOWLS VÉGÉ ───────────────────────────────────────────────
    {
        "subcategory_slug": "bowl-vege",
        "name": "Buddha bowl légumes rôtis & houmous",
        "description": "Le bowl coloré de TikTok : tout rôti au four, sauce houmous.",
        "calories": 480, "protein": 18, "carbs": 58, "fat": 20,
        "prep_time_min": 30, "difficulty": "facile",
        "ingredients": [
            {"name": "Pois chiches", "quantity_g": 100, "unit": "g"},
            {"name": "Patate douce", "quantity_g": 150, "unit": "g"},
            {"name": "Chou rouge", "quantity_g": 80, "unit": "g"},
            {"name": "Houmous", "quantity_g": 60, "unit": "g"},
            {"name": "Roquette, grenade", "quantity_g": 40, "unit": "g"},
        ],
        "steps": [
            "Rôtir pois chiches et patate douce 25 min à 200°C.",
            "Émincer finement le chou rouge.",
            "Assembler le bowl avec la roquette en base.",
            "Poser houmous, pois chiches, patate douce et chou. Parsemer de grenade.",
        ],
    },
    # ── BOWLS ASIAN ──────────────────────────────────────────────
    {
        "subcategory_slug": "bowl-asian",
        "name": "Poke bowl saumon & mangue",
        "description": "Le poke bowl viral : frais, coloré, trop bon.",
        "calories": 540, "protein": 35, "carbs": 55, "fat": 18,
        "prep_time_min": 20, "difficulty": "facile",
        "ingredients": [
            {"name": "Saumon frais", "quantity_g": 150, "unit": "g"},
            {"name": "Riz sushi", "quantity_g": 100, "unit": "g (cru)"},
            {"name": "Mangue", "quantity_g": 80, "unit": "g"},
            {"name": "Edamame", "quantity_g": 50, "unit": "g"},
            {"name": "Sauce soja, sésame, sriracha", "quantity_g": 25, "unit": "ml"},
        ],
        "steps": [
            "Cuire le riz sushi, assaisonner vinaigre + sucre + sel.",
            "Couper le saumon en dés, mariner 5 min dans soja + sésame.",
            "Assembler : riz + saumon + mangue + edamame.",
            "Finir avec sriracha et sésame noir.",
        ],
    },

    # ── SALADES REPAS ─────────────────────────────────────────────
    {
        "subcategory_slug": "salade-repas",
        "name": "Salade César poulet grillé",
        "description": "La reine des salades repas : crunchy, crémeuse, protéinée.",
        "calories": 450, "protein": 40, "carbs": 22, "fat": 22,
        "prep_time_min": 20, "difficulty": "facile",
        "ingredients": [
            {"name": "Blanc de poulet", "quantity_g": 150, "unit": "g"},
            {"name": "Salade romaine", "quantity_g": 100, "unit": "g"},
            {"name": "Parmesan râpé", "quantity_g": 20, "unit": "g"},
            {"name": "Croûtons maison", "quantity_g": 30, "unit": "g"},
            {"name": "Sauce César légère", "quantity_g": 40, "unit": "ml"},
        ],
        "steps": [
            "Griller le poulet assaisonné, trancher.",
            "Mélanger romaine + sauce César.",
            "Ajouter poulet, parmesan, croûtons.",
        ],
    },
    {
        "subcategory_slug": "salade-repas",
        "name": "Salade niçoise au thon",
        "description": "La niçoise traditionnelle version pleine assiette.",
        "calories": 420, "protein": 35, "carbs": 28, "fat": 18,
        "prep_time_min": 15, "difficulty": "facile",
        "ingredients": [
            {"name": "Thon en boîte", "quantity_g": 130, "unit": "g"},
            {"name": "Haricots verts cuits", "quantity_g": 100, "unit": "g"},
            {"name": "Œuf dur", "quantity_g": 60, "unit": "g"},
            {"name": "Tomates cerises", "quantity_g": 80, "unit": "g"},
            {"name": "Olives, anchois", "quantity_g": 30, "unit": "g"},
            {"name": "Vinaigrette basilic", "quantity_g": 20, "unit": "ml"},
        ],
        "steps": [
            "Cuire les œufs durs 10 min, refroidir.",
            "Disposer salade + haricots + tomates + thon + œufs + olives.",
            "Arroser de vinaigrette.",
        ],
    },
    # ── SALADES FRAÎCHES ──────────────────────────────────────────
    {
        "subcategory_slug": "salade-fraiche",
        "name": "Taboulé libanais frais",
        "description": "Version authentique : beaucoup de persil, peu de semoule.",
        "calories": 280, "protein": 8, "carbs": 35, "fat": 12,
        "prep_time_min": 20, "difficulty": "facile",
        "ingredients": [
            {"name": "Boulgour", "quantity_g": 50, "unit": "g (cru)"},
            {"name": "Persil plat frais", "quantity_g": 80, "unit": "g"},
            {"name": "Tomates", "quantity_g": 100, "unit": "g"},
            {"name": "Citron", "quantity_g": 40, "unit": "ml"},
            {"name": "Huile d'olive", "quantity_g": 20, "unit": "ml"},
            {"name": "Menthe fraîche", "quantity_g": 10, "unit": "g"},
        ],
        "steps": [
            "Réhydrater le boulgour dans l'eau bouillante 10 min, égoutter.",
            "Hacher finement persil et menthe.",
            "Couper les tomates en petits dés.",
            "Mélanger tout avec citron, huile, sel.",
        ],
    },

    # ── TOFU ──────────────────────────────────────────────────────
    {
        "subcategory_slug": "tofu",
        "name": "Tofu laqué sésame & sauce soja",
        "description": "Le tofu croustillant façon TikTok : croustillant dehors, moelleux dedans.",
        "calories": 360, "protein": 22, "carbs": 28, "fat": 16,
        "prep_time_min": 20, "difficulty": "facile",
        "ingredients": [
            {"name": "Tofu ferme", "quantity_g": 200, "unit": "g"},
            {"name": "Sauce soja", "quantity_g": 30, "unit": "ml"},
            {"name": "Fécule de maïs", "quantity_g": 15, "unit": "g"},
            {"name": "Sésame", "quantity_g": 5, "unit": "g"},
            {"name": "Miel", "quantity_g": 10, "unit": "g"},
        ],
        "steps": [
            "Presser le tofu dans un torchon 15 min pour enlever l'eau.",
            "Couper en cubes, enrober de fécule.",
            "Poêler dans l'huile chaude 3 min de chaque côté jusqu'à dorure.",
            "Ajouter soja + miel, caraméliser 2 min. Parsemer sésame.",
        ],
    },
    {
        "subcategory_slug": "tofu",
        "name": "Tofu scramble façon œufs brouillés",
        "description": "La version végane des œufs brouillés : curcuma, levure nutritionnelle.",
        "calories": 280, "protein": 20, "carbs": 12, "fat": 16,
        "prep_time_min": 10, "difficulty": "facile",
        "ingredients": [
            {"name": "Tofu soyeux", "quantity_g": 200, "unit": "g"},
            {"name": "Curcuma", "quantity_g": 3, "unit": "g"},
            {"name": "Levure nutritionnelle", "quantity_g": 10, "unit": "g"},
            {"name": "Poivron, oignon", "quantity_g": 80, "unit": "g"},
            {"name": "Pain complet", "quantity_g": 60, "unit": "g"},
        ],
        "steps": [
            "Écraser le tofu grossièrement à la fourchette.",
            "Faire revenir poivron et oignon 3 min.",
            "Ajouter le tofu, curcuma et levure. Mélanger 3 min.",
            "Servir sur toast de pain complet.",
        ],
    },
    # ── ŒUFS ─────────────────────────────────────────────────────
    {
        "subcategory_slug": "oeufs",
        "name": "Shakshuka épicée aux œufs",
        "description": "Le plat du Maghreb qui a explosé sur TikTok : œufs pochés dans sauce tomate.",
        "calories": 380, "protein": 24, "carbs": 28, "fat": 18,
        "prep_time_min": 20, "difficulty": "facile",
        "ingredients": [
            {"name": "Œufs", "quantity_g": 180, "unit": "g (3 œufs)"},
            {"name": "Tomates concassées", "quantity_g": 250, "unit": "g"},
            {"name": "Poivrons", "quantity_g": 100, "unit": "g"},
            {"name": "Oignon, ail", "quantity_g": 60, "unit": "g"},
            {"name": "Paprika, cumin, piment", "quantity_g": 8, "unit": "g"},
            {"name": "Pain pita", "quantity_g": 60, "unit": "g"},
        ],
        "steps": [
            "Faire revenir oignon et ail, ajouter poivrons 3 min.",
            "Ajouter épices et tomates, mijoter 10 min.",
            "Creuser des puits dans la sauce, casser les œufs, couvrir 5-7 min.",
            "Servir avec pain pita et coriandre.",
        ],
    },
    {
        "subcategory_slug": "oeufs",
        "name": "Omelette grecque feta & épinards",
        "description": "L'omelette qui sort de l'ordinaire. Rapide et rassasiante.",
        "calories": 380, "protein": 28, "carbs": 6, "fat": 26,
        "prep_time_min": 10, "difficulty": "facile",
        "ingredients": [
            {"name": "Œufs", "quantity_g": 180, "unit": "g (3 œufs)"},
            {"name": "Feta", "quantity_g": 40, "unit": "g"},
            {"name": "Épinards frais", "quantity_g": 60, "unit": "g"},
            {"name": "Tomates séchées", "quantity_g": 20, "unit": "g"},
            {"name": "Olives noires", "quantity_g": 15, "unit": "g"},
        ],
        "steps": [
            "Battre les œufs avec sel et poivre.",
            "Poêler les épinards 2 min pour les faire tomber.",
            "Verser les œufs, ajouter feta émiettée, tomates séchées, olives.",
            "Plier en deux et servir.",
        ],
    },
    # ── LÉGUMINEUSES ──────────────────────────────────────────────
    {
        "subcategory_slug": "legumineuses",
        "name": "Dal de lentilles corail & coco",
        "description": "Le curry vegan incontournable : réconfortant, protéiné, anti-gaspi.",
        "calories": 420, "protein": 20, "carbs": 58, "fat": 12,
        "prep_time_min": 25, "difficulty": "facile",
        "ingredients": [
            {"name": "Lentilles corail", "quantity_g": 100, "unit": "g (cru)"},
            {"name": "Lait de coco", "quantity_g": 150, "unit": "ml"},
            {"name": "Tomates concassées", "quantity_g": 150, "unit": "g"},
            {"name": "Oignon, ail, gingembre", "quantity_g": 60, "unit": "g"},
            {"name": "Curry, cumin, curcuma", "quantity_g": 8, "unit": "g"},
        ],
        "steps": [
            "Faire revenir oignon, ail et gingembre avec les épices.",
            "Ajouter lentilles + tomates + lait de coco + 200ml d'eau.",
            "Mijoter 20 min jusqu'à consistency veloutée.",
            "Servir avec riz ou pain naan.",
        ],
    },

    # ── PÂTES ────────────────────────────────────────────────────
    {
        "subcategory_slug": "pates",
        "name": "Pasta pesto poulet & tomates cerises",
        "description": "Le plat pâtes TikTok : simple, rapide, copieux.",
        "calories": 560, "protein": 42, "carbs": 58, "fat": 16,
        "prep_time_min": 20, "difficulty": "facile",
        "ingredients": [
            {"name": "Pâtes fusilli", "quantity_g": 80, "unit": "g (cru)"},
            {"name": "Blanc de poulet", "quantity_g": 150, "unit": "g"},
            {"name": "Pesto basilic", "quantity_g": 30, "unit": "g"},
            {"name": "Tomates cerises", "quantity_g": 80, "unit": "g"},
            {"name": "Parmesan", "quantity_g": 15, "unit": "g"},
        ],
        "steps": [
            "Cuire les pâtes al dente, réserver 50ml d'eau de cuisson.",
            "Poêler le poulet coupé en lanières.",
            "Mélanger pâtes + pesto + eau de cuisson + poulet + tomates cerises.",
            "Parsemer de parmesan.",
        ],
    },
    {
        "subcategory_slug": "pates",
        "name": "Carbonara light au poulet",
        "description": "La vraie carbonara mais avec du poulet et crème légère.",
        "calories": 580, "protein": 44, "carbs": 52, "fat": 18,
        "prep_time_min": 20, "difficulty": "moyen",
        "ingredients": [
            {"name": "Spaghettis", "quantity_g": 80, "unit": "g (cru)"},
            {"name": "Blanc de poulet", "quantity_g": 130, "unit": "g"},
            {"name": "Œufs", "quantity_g": 120, "unit": "g (2 œufs)"},
            {"name": "Crème légère 5%", "quantity_g": 50, "unit": "ml"},
            {"name": "Parmesan", "quantity_g": 20, "unit": "g"},
            {"name": "Poivre noir concassé", "quantity_g": 2, "unit": "g"},
        ],
        "steps": [
            "Cuire les spaghettis al dente, réserver l'eau de cuisson.",
            "Poêler le poulet coupé en dés.",
            "Battre œufs + crème + parmesan + poivre.",
            "Hors du feu, mélanger pâtes + sauce + poulet. Ajouter eau de cuisson si trop épais.",
        ],
    },
    # ── RIZ ──────────────────────────────────────────────────────
    {
        "subcategory_slug": "riz",
        "name": "Riz cantonais maison protéiné",
        "description": "Le riz sauté TikTok : crevettes, œuf, riz froid. Technique du wok.",
        "calories": 480, "protein": 30, "carbs": 58, "fat": 12,
        "prep_time_min": 15, "difficulty": "facile",
        "ingredients": [
            {"name": "Riz blanc cuit froid", "quantity_g": 150, "unit": "g"},
            {"name": "Crevettes", "quantity_g": 100, "unit": "g"},
            {"name": "Œuf", "quantity_g": 60, "unit": "g"},
            {"name": "Petits pois", "quantity_g": 50, "unit": "g"},
            {"name": "Sauce soja, huile de sésame", "quantity_g": 20, "unit": "ml"},
            {"name": "Oignons verts", "quantity_g": 15, "unit": "g"},
        ],
        "steps": [
            "Wok très chaud avec un peu d'huile.",
            "Brouiller l'œuf rapidement, réserver.",
            "Sauter les crevettes + petits pois 2 min.",
            "Ajouter le riz froid, sauter à feu vif 3 min en mélangeant.",
            "Ajouter soja, sésame, œuf et oignons verts.",
        ],
    },
    # ── PATATE ───────────────────────────────────────────────────
    {
        "subcategory_slug": "patate",
        "name": "Patate douce farcie au thon",
        "description": "Meal prep hero : 5 minutes de préparation si la patate est déjà cuite.",
        "calories": 460, "protein": 34, "carbs": 52, "fat": 10,
        "prep_time_min": 40, "difficulty": "facile",
        "ingredients": [
            {"name": "Patate douce", "quantity_g": 250, "unit": "g"},
            {"name": "Thon en boîte", "quantity_g": 130, "unit": "g"},
            {"name": "Fromage blanc 0%", "quantity_g": 60, "unit": "g"},
            {"name": "Oignon rouge, ciboulette", "quantity_g": 30, "unit": "g"},
            {"name": "Citron, piment", "quantity_g": 10, "unit": "g"},
        ],
        "steps": [
            "Cuire la patate douce entière au four 35 min à 200°C.",
            "Mélanger thon égoutté + fromage blanc + oignon + ciboulette + citron.",
            "Ouvrir la patate en deux, remplir de garniture.",
        ],
    },

    # ── SAUCES ────────────────────────────────────────────────────
    {
        "subcategory_slug": "sauce-ail",
        "name": "Sauce ail confit & herbes",
        "description": "L'ail confit au four : doux, fondant, sans piquant. Sur tout.",
        "calories": 120, "protein": 1, "carbs": 8, "fat": 10,
        "prep_time_min": 40, "difficulty": "facile",
        "ingredients": [
            {"name": "Ail (1 tête entière)", "quantity_g": 50, "unit": "g"},
            {"name": "Huile d'olive", "quantity_g": 20, "unit": "ml"},
            {"name": "Romarin, thym", "quantity_g": 3, "unit": "g"},
        ],
        "steps": [
            "Couper le sommet de la tête d'ail, arroser d'huile et d'herbes.",
            "Envelopper en papillote, cuire 35 min à 180°C.",
            "Presser les gousses pour obtenir une purée crémeuse.",
            "Utiliser comme base de sauce, dans un vinaigrette ou sur une viande.",
        ],
    },
    {
        "subcategory_slug": "sauce-ail",
        "name": "Sauce teriyaki maison (sans sucre raffiné)",
        "description": "Meilleure que le commerce : miel, soja, vinaigre de riz.",
        "calories": 80, "protein": 2, "carbs": 16, "fat": 0,
        "prep_time_min": 5, "difficulty": "facile",
        "ingredients": [
            {"name": "Sauce soja", "quantity_g": 60, "unit": "ml"},
            {"name": "Miel", "quantity_g": 30, "unit": "g"},
            {"name": "Vinaigre de riz", "quantity_g": 20, "unit": "ml"},
            {"name": "Fécule de maïs", "quantity_g": 5, "unit": "g"},
            {"name": "Ail en poudre", "quantity_g": 2, "unit": "g"},
        ],
        "steps": [
            "Mélanger soja, miel, vinaigre et ail dans une casserole.",
            "Délayer la fécule dans 1 cs d'eau froide, ajouter au mélange.",
            "Chauffer à feu moyen en remuant jusqu'à épaississement.",
            "Se conserve 2 semaines au frigo.",
        ],
    },
    {
        "subcategory_slug": "sauce-sucree",
        "name": "Sauce miel moutarde",
        "description": "2 ingrédients, infinie versatilité. Sur tout.",
        "calories": 90, "protein": 1, "carbs": 18, "fat": 2,
        "prep_time_min": 2, "difficulty": "facile",
        "ingredients": [
            {"name": "Miel", "quantity_g": 40, "unit": "g"},
            {"name": "Moutarde à l'ancienne", "quantity_g": 30, "unit": "g"},
            {"name": "Citron", "quantity_g": 10, "unit": "ml"},
        ],
        "steps": [
            "Mélanger miel, moutarde et jus de citron.",
            "Ajuster la proportion selon le goût (plus sucré ou plus piquant).",
        ],
    },
    {
        "subcategory_slug": "sauce-sucree",
        "name": "Sauce BBQ maison fumée",
        "description": "La vraie sauce BBQ américaine : fumée, sucrée, légèrement pimentée.",
        "calories": 100, "protein": 1, "carbs": 22, "fat": 1,
        "prep_time_min": 15, "difficulty": "facile",
        "ingredients": [
            {"name": "Ketchup", "quantity_g": 80, "unit": "g"},
            {"name": "Miel", "quantity_g": 30, "unit": "g"},
            {"name": "Vinaigre de cidre", "quantity_g": 20, "unit": "ml"},
            {"name": "Paprika fumé", "quantity_g": 5, "unit": "g"},
            {"name": "Sauce Worcestershire", "quantity_g": 10, "unit": "ml"},
        ],
        "steps": [
            "Mélanger tous les ingrédients dans une casserole.",
            "Chauffer à feu doux 10 min en remuant.",
            "Laisser refroidir. Se conserve 3 semaines au frigo.",
        ],
    },
    {
        "subcategory_slug": "sauce-epicee",
        "name": "Sauce harissa fraîche maison",
        "description": "La harissa comme en Tunisie : piments, ail, coriandre.",
        "calories": 60, "protein": 2, "carbs": 8, "fat": 3,
        "prep_time_min": 15, "difficulty": "facile",
        "ingredients": [
            {"name": "Piments rouges séchés", "quantity_g": 30, "unit": "g"},
            {"name": "Ail", "quantity_g": 10, "unit": "g"},
            {"name": "Huile d'olive", "quantity_g": 15, "unit": "ml"},
            {"name": "Cumin, coriandre", "quantity_g": 5, "unit": "g"},
            {"name": "Sel", "quantity_g": 3, "unit": "g"},
        ],
        "steps": [
            "Réhydrater les piments 20 min dans l'eau bouillante.",
            "Mixer piments égouttés + ail + épices + huile.",
            "Ajuster sel et consistance avec l'huile.",
        ],
    },
    {
        "subcategory_slug": "sauce-epicee",
        "name": "Sauce sriracha mayo",
        "description": "La sauce street food qui va sur tout : burgers, bowls, sushis.",
        "calories": 130, "protein": 1, "carbs": 4, "fat": 12,
        "prep_time_min": 2, "difficulty": "facile",
        "ingredients": [
            {"name": "Mayonnaise légère", "quantity_g": 60, "unit": "g"},
            {"name": "Sriracha", "quantity_g": 20, "unit": "g"},
            {"name": "Citron vert", "quantity_g": 5, "unit": "ml"},
        ],
        "steps": [
            "Mélanger mayo + sriracha + citron.",
            "Goûter et ajuster le piquant selon envie.",
        ],
    },
    {
        "subcategory_slug": "sauce-fraiche",
        "name": "Sauce tzatziki maison",
        "description": "Fraîche, légère, protéinée. Avec tout.",
        "calories": 70, "protein": 5, "carbs": 5, "fat": 3,
        "prep_time_min": 10, "difficulty": "facile",
        "ingredients": [
            {"name": "Yaourt grec 0%", "quantity_g": 150, "unit": "g"},
            {"name": "Concombre", "quantity_g": 80, "unit": "g"},
            {"name": "Ail", "quantity_g": 5, "unit": "g"},
            {"name": "Aneth frais", "quantity_g": 5, "unit": "g"},
            {"name": "Citron, huile d'olive", "quantity_g": 15, "unit": "ml"},
        ],
        "steps": [
            "Râper le concombre et presser pour enlever l'eau.",
            "Mélanger yaourt + concombre + ail râpé + aneth + citron + huile.",
            "Réfrigérer 30 min avant de servir pour que les saveurs se mélangent.",
        ],
    },
    {
        "subcategory_slug": "sauce-fraiche",
        "name": "Sauce yaourt citron & herbes",
        "description": "La sauce fitness : 0% de culpabilité, 100% de saveur.",
        "calories": 55, "protein": 5, "carbs": 4, "fat": 1,
        "prep_time_min": 5, "difficulty": "facile",
        "ingredients": [
            {"name": "Yaourt grec 0%", "quantity_g": 150, "unit": "g"},
            {"name": "Citron (jus + zeste)", "quantity_g": 20, "unit": "ml"},
            {"name": "Persil, menthe fraîche", "quantity_g": 10, "unit": "g"},
            {"name": "Ail en poudre", "quantity_g": 2, "unit": "g"},
        ],
        "steps": [
            "Mélanger yaourt + jus et zeste de citron + herbes hachées + ail.",
            "Assaisonner sel et poivre.",
            "Idéale pour dips, salades et viandes grillées.",
        ],
    },
    {
        "subcategory_slug": "sauce-asian",
        "name": "Sauce sésame & soja style japonais",
        "description": "La sauce de dipping qui transforme n'importe quel bowl.",
        "calories": 100, "protein": 3, "carbs": 8, "fat": 7,
        "prep_time_min": 5, "difficulty": "facile",
        "ingredients": [
            {"name": "Sauce soja", "quantity_g": 40, "unit": "ml"},
            {"name": "Huile de sésame grillé", "quantity_g": 15, "unit": "ml"},
            {"name": "Vinaigre de riz", "quantity_g": 15, "unit": "ml"},
            {"name": "Gingembre râpé", "quantity_g": 5, "unit": "g"},
            {"name": "Sésame blanc", "quantity_g": 5, "unit": "g"},
        ],
        "steps": [
            "Mélanger tous les ingrédients.",
            "Goûter et ajuster avec du miel si trop salé.",
            "Se conserve 2 semaines au réfrigérateur.",
        ],
    },
    {
        "subcategory_slug": "sauce-asian",
        "name": "Sauce nuoc mam vietnamienne",
        "description": "La sauce équilibrée du Vietnam : sucrée, salée, acide, pimentée.",
        "calories": 45, "protein": 1, "carbs": 10, "fat": 0,
        "prep_time_min": 5, "difficulty": "facile",
        "ingredients": [
            {"name": "Nuoc mam (sauce poisson)", "quantity_g": 30, "unit": "ml"},
            {"name": "Citron vert", "quantity_g": 30, "unit": "ml"},
            {"name": "Sucre", "quantity_g": 15, "unit": "g"},
            {"name": "Eau", "quantity_g": 30, "unit": "ml"},
            {"name": "Piment, ail", "quantity_g": 5, "unit": "g"},
        ],
        "steps": [
            "Dissoudre le sucre dans l'eau tiède.",
            "Ajouter nuoc mam, citron, piment et ail haché.",
            "Mélanger et ajuster l'équilibre sucré/salé/acide selon goût.",
        ],
    },
    {
        "subcategory_slug": "sauce-base",
        "name": "Vinaigrette balsamique maison",
        "description": "La vinaigrette de restaurant à faire à la maison en 2 minutes.",
        "calories": 80, "protein": 0, "carbs": 5, "fat": 7,
        "prep_time_min": 2, "difficulty": "facile",
        "ingredients": [
            {"name": "Vinaigre balsamique", "quantity_g": 30, "unit": "ml"},
            {"name": "Huile d'olive", "quantity_g": 30, "unit": "ml"},
            {"name": "Moutarde de Dijon", "quantity_g": 10, "unit": "g"},
            {"name": "Miel", "quantity_g": 5, "unit": "g"},
            {"name": "Ail en poudre, sel", "quantity_g": 2, "unit": "g"},
        ],
        "steps": [
            "Mélanger vinaigre + moutarde + miel + ail.",
            "Incorporer l'huile en filet en fouettant.",
            "Se conserve 2 semaines au frigo en bocal.",
        ],
    },
    {
        "subcategory_slug": "sauce-base",
        "name": "Sauce tahini citron",
        "description": "La sauce orientale incontournable des bowls et salades.",
        "calories": 110, "protein": 4, "carbs": 5, "fat": 9,
        "prep_time_min": 5, "difficulty": "facile",
        "ingredients": [
            {"name": "Tahini (purée de sésame)", "quantity_g": 40, "unit": "g"},
            {"name": "Citron (jus)", "quantity_g": 30, "unit": "ml"},
            {"name": "Eau", "quantity_g": 30, "unit": "ml"},
            {"name": "Ail en poudre", "quantity_g": 2, "unit": "g"},
            {"name": "Sel", "quantity_g": 1, "unit": "g"},
        ],
        "steps": [
            "Mélanger tahini + citron + ail + sel.",
            "Ajouter l'eau petit à petit jusqu'à consistency crémeuse souhaitée.",
            "La sauce épaissit au frigo — ajouter un peu d'eau pour détendre.",
        ],
    },
]


# ────────────────────────────────────────────────────────────────────
# Seed logic
# ────────────────────────────────────────────────────────────────────

async def seed():
    async with AsyncSessionLocal() as session:
        # Skip if already seeded
        existing = await session.execute(select(RecipeCategory).limit(1))
        if existing.scalar_one_or_none():
            print("Library already seeded. Skipping.")
            return

        slug_to_subcat: dict[str, RecipeSubcategory] = {}

        for cat_data in CATEGORIES:
            category = RecipeCategory(
                id=uuid.uuid4(),
                slug=cat_data["slug"],
                name=cat_data["name"],
                emoji=cat_data["emoji"],
                description=cat_data.get("description"),
                order=cat_data["order"],
            )
            session.add(category)
            await session.flush()

            for sub_data in cat_data["subcategories"]:
                subcat = RecipeSubcategory(
                    id=uuid.uuid4(),
                    category_id=category.id,
                    slug=sub_data["slug"],
                    name=sub_data["name"],
                    emoji=sub_data["emoji"],
                    order=sub_data["order"],
                )
                session.add(subcat)
                await session.flush()
                slug_to_subcat[sub_data["slug"]] = subcat

        for r in RECIPES:
            subcat = slug_to_subcat.get(r["subcategory_slug"])
            recipe = Recipe(
                id=uuid.uuid4(),
                subcategory_id=subcat.id if subcat else None,
                name=r["name"],
                description=r.get("description"),
                calories=r.get("calories"),
                protein=r.get("protein"),
                carbs=r.get("carbs"),
                fat=r.get("fat"),
                prep_time_min=r.get("prep_time_min", 20),
                difficulty=r.get("difficulty", "facile"),
                ingredients=r.get("ingredients", []),
                steps=r.get("steps", []),
                tiktok_url=r.get("tiktok_url"),
                image_urls=r.get("image_urls", []),
            )
            session.add(recipe)

        await session.commit()
        print(f"Seeded {len(CATEGORIES)} categories and {len(RECIPES)} recipes.")


if __name__ == "__main__":
    asyncio.run(seed())
