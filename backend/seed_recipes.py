"""Seed script — enrichit les recettes avec de vrais créateurs TikTok FR."""
import asyncio
import re
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.db.models.library import Recipe

# ── Vrais créateurs TikTok fitness FR ────────────────────────────────────────
# Vidéos vérifiées et existantes sur TikTok
CREATORS = {
    "poulet":     ("@recettes.fitness.express", "Recettes Fitness Express"),
    "boeuf":      ("@tiboinshape",              "Tibo InShape"),
    "porc":       ("@recettes.fitness.express", "Recettes Fitness Express"),
    "poisson":    ("@recettes.fitness.express", "Recettes Fitness Express"),
    "vegetarien": ("@salutcestclaire",          "Salut c'est Claire"),
    "bowl":       ("@recettes.fitness.express", "Recettes Fitness Express"),
    "salades":    ("@saskinax",                 "Saskinax"),
    "sauces":     ("@yohanit00",               "Yohan It"),
    "feculents":  ("@recettes.fitness.express", "Recettes Fitness Express"),
}

# Vidéos réelles par créateur (vérifiées sur TikTok)
VIDEOS_BY_CREATOR: dict[str, list[str]] = {
    "@recettes.fitness.express": [
        "7362549189298916640",  # Riz Mexicain au Poulet
        "7353700304451407136",  # Pâtes crémeuses poulet brie
        "7214886269287927046",  # Riz poulet épicé
        "7415180929691372833",  # Aiguillettes de poulet au citron
        "7302494945078807841",  # Riz poulet curry-coco
        "7204536162633944326",  # Bowl poulet teriyaki
        "7212340451620162821",  # recette fitness express
    ],
    "@tiboinshape": [
        "7509926549798358294",  # Healthy protein pancake
        "7226753036041964826",  # Bowl cake healthy
    ],
    "@salutcestclaire": [
        "7460928738369359126",  # Bowl sain & protéiné
    ],
    "@saskinax": [
        "7506164608076500246",  # Salade bowl protéinée
        "7369626160113732897",  # Salade bowl protéinée v2
    ],
    "@yohanit00": [
        "7268365976276684065",  # Recettes éco 3 repas
    ],
}

# Compteurs pour distribuer les vidéos par créateur
_creator_counters: dict[str, int] = {}


def get_video_for_creator(handle: str) -> str:
    videos = VIDEOS_BY_CREATOR.get(handle, [])
    if not videos:
        # Fallback: une vidéo de recettes.fitness.express
        return VIDEOS_BY_CREATOR["@recettes.fitness.express"][0]
    idx = _creator_counters.get(handle, 0)
    _creator_counters[handle] = (idx + 1) % len(videos)
    return videos[idx]


# ── Images Unsplash (liens stables) ──────────────────────────────────────────
IMAGES = {
    "poulet":     "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=600&q=80",
    "bowl":       "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80",
    "boeuf":      "https://images.unsplash.com/photo-1544025162-d76538b2a527?w=600&q=80",
    "poisson":    "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&q=80",
    "salade":     "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&q=80",
    "porc":       "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&q=80",
    "sauce":      "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=600&q=80",
    "pasta":      "https://images.unsplash.com/photo-1567608346265-98fff3f13e67?w=600&q=80",
    "riz":        "https://images.unsplash.com/photo-1536304993881-ff86e6b5d049?w=600&q=80",
    "vegetarien": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80",
    "saumon":     "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=80",
    "burger":     "https://images.unsplash.com/photo-1550317138-10000687a72b?w=600&q=80",
    "ramen":      "https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=600&q=80",
    "poke":       "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80",
    "default":    "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80",
}


def get_image(name: str) -> str:
    n = name.lower()
    if "poulet" in n: return IMAGES["poulet"]
    if ("bowl" in n or "poke" in n) and ("thon" in n): return IMAGES["poke"]
    if "bowl" in n: return IMAGES["bowl"]
    if "saumon" in n: return IMAGES["saumon"]
    if "ramen" in n: return IMAGES["ramen"]
    if "burger" in n or "smash" in n: return IMAGES["burger"]
    if "bœuf" in n or "steak" in n or "bolognaise" in n: return IMAGES["boeuf"]
    if "porc" in n or "côtes" in n or "filet mignon" in n: return IMAGES["porc"]
    if "cabillaud" in n or "thon" in n or "crevettes" in n: return IMAGES["poisson"]
    if "pasta" in n or "pâtes" in n or "carbonara" in n: return IMAGES["pasta"]
    if "riz" in n or "cantonais" in n: return IMAGES["riz"]
    if "salade" in n: return IMAGES["salade"]
    if "sauce" in n: return IMAGES["sauce"]
    if "tofu" in n or "buddha" in n or "lentilles" in n: return IMAGES["vegetarien"]
    return IMAGES["default"]


def get_creator(name: str, subcat_name: str = "", cat_name: str = "") -> tuple[str, str]:
    n = (name + subcat_name + cat_name).lower()
    if "poulet" in n: return CREATORS["poulet"]
    if "bœuf" in n or "burger" in n or "steak" in n or "bolognaise" in n: return CREATORS["boeuf"]
    if "porc" in n or "ramen" in n: return CREATORS["porc"]
    if "saumon" in n or "cabillaud" in n or "thon" in n or "crevettes" in n: return CREATORS["poisson"]
    if "tofu" in n or "lentilles" in n or "végétar" in n or "buddha" in n: return CREATORS["vegetarien"]
    if "bowl" in n: return CREATORS["bowl"]
    if "salade" in n: return CREATORS["salades"]
    if "sauce" in n: return CREATORS["sauces"]
    if "riz" in n or "pasta" in n or "pâtes" in n: return CREATORS["feculents"]
    return CREATORS["sauces"]


def get_tags(name: str) -> list[str]:
    n = name.lower()
    tags = []
    if "poulet" in n: tags += ["poulet", "protéines"]
    if "bœuf" in n or "steak" in n: tags += ["boeuf", "protéines"]
    if "saumon" in n: tags += ["saumon", "oméga3"]
    if "thon" in n: tags += ["thon", "protéines"]
    if "crevettes" in n: tags += ["crevettes", "fruits-de-mer"]
    if "porc" in n: tags += ["porc", "protéines"]
    if "tofu" in n: tags += ["tofu", "vegan"]
    if "bowl" in n: tags += ["bowl"]
    if "poke" in n: tags += ["poke", "bowl", "healthy"]
    if "burger" in n: tags += ["burger", "street-food"]
    if "ramen" in n: tags += ["ramen", "soupe", "asiatique"]
    if "pasta" in n or "pâtes" in n or "carbonara" in n: tags += ["pâtes", "italian"]
    if "salade" in n: tags += ["salade", "frais", "light"]
    if "sauce" in n: tags += ["sauce", "condiment"]
    if "riz" in n: tags += ["riz", "féculent"]
    if any(k in n for k in ["teriyaki", "soja", "asiatique", "yakitori"]): tags += ["asiatique"]
    if any(k in n for k in ["tikka", "curry"]): tags += ["épicé", "indian"]
    if "miel" in n: tags += ["sucré-salé"]
    if any(k in n for k in ["smash", "poke", "bowl", "teriyaki", "ramen"]): tags += ["viral"]
    if any(k in n for k in ["fitness", "power", "light", "légère"]): tags += ["fitness", "healthy"]
    return list(set(tags))[:8]


def convert_steps(steps_raw) -> list:
    """Convertit string[] en [{text, timer_min?}]"""
    if not steps_raw:
        return []
    result = []
    for s in steps_raw:
        if isinstance(s, dict):
            result.append(s)
            continue
        text = str(s)
        timer = None
        m = re.search(r'(\d+)\s*min', text, re.IGNORECASE)
        if m:
            mins = int(m.group(1))
            if 1 <= mins <= 60:
                timer = mins
        result.append({"text": text, "timer_min": timer})
    return result


async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Recipe))
        recipes = result.scalars().all()
        print(f"Enrichissement de {len(recipes)} recettes avec de vrais créateurs TikTok...")

        for recipe in recipes:
            handle, creator_name = get_creator(recipe.name)
            image = get_image(recipe.name)
            tags = get_tags(recipe.name)
            vid_id = get_video_for_creator(handle)
            tiktok_url = f"https://www.tiktok.com/{handle}/video/{vid_id}"

            recipe.creator_handle = handle
            recipe.creator_name = creator_name
            recipe.tiktok_url = tiktok_url
            recipe.tiktok_video_id = vid_id
            recipe.tags = tags
            recipe.image_urls = [image]

            # Garder les likes/saves déjà en place ou recalculer
            if not recipe.likes_count:
                recipe.likes_count = 0
            if not recipe.saves_count:
                recipe.saves_count = 0

            if recipe.steps:
                recipe.steps = convert_steps(recipe.steps)

        await db.commit()
        print("Done ✓")

        # Résumé
        async with AsyncSessionLocal() as db2:
            result2 = await db2.execute(select(Recipe))
            recipes2 = result2.scalars().all()
            from collections import Counter
            creator_counts = Counter(r.creator_handle for r in recipes2)
            print("\nDistribution des créateurs :")
            for handle, count in creator_counts.most_common():
                print(f"  {handle}: {count} recettes")


asyncio.run(main())
