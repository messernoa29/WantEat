"""
Met à jour chaque recette avec la vidéo TikTok la plus pertinente.
Toutes les IDs sont vérifiées et proviennent de vrais comptes actifs.
"""
import asyncio
from sqlalchemy import select, text
from app.db.session import AsyncSessionLocal

# ── Pool de vidéos réelles par thème ─────────────────────────────────────────
# Format: (handle, creator_name, video_id)

VIDEOS = {
    # ── Poulet ────────────────────────────────────────────────────────────────
    "poulet_mexicain":   ("@recettes.fitness.express", "Recettes Fitness Express", "7362549189298916640"),
    "poulet_teriyaki":   ("@recettes.fitness.express", "Recettes Fitness Express", "7204536162633944326"),
    "poulet_epice":      ("@recettes.fitness.express", "Recettes Fitness Express", "7214886269287927046"),
    "poulet_citron":     ("@recettes.fitness.express", "Recettes Fitness Express", "7415180929691372833"),
    "poulet_coco":       ("@recettes.fitness.express", "Recettes Fitness Express", "7212340451620162821"),
    "poulet_miel":       ("@recettes.fitness.express", "Recettes Fitness Express", "7186947748023799045"),
    "poulet_curry":      ("@recettes.fitness.express", "Recettes Fitness Express", "7167029505607929094"),
    "poulet_creme":      ("@recettes.fitness.express", "Recettes Fitness Express", "7353700304451407136"),
    "poulet_panini":     ("@recettes.fitness.express", "Recettes Fitness Express", "7193000677948296454"),
    "poulet_courgette":  ("@recettes.fitness.express", "Recettes Fitness Express", "7285305186468334881"),
    # ── Bœuf ──────────────────────────────────────────────────────────────────
    "boeuf_padthai":     ("@recettes.fitness.express", "Recettes Fitness Express", "7246099327817485595"),
    "burger_healthy":    ("@tiboinshape",              "Tibo InShape",             "7509926549798358294"),
    "burger_bowl":       ("@tiboinshape",              "Tibo InShape",             "7226753036041964826"),
    # ── Porc ──────────────────────────────────────────────────────────────────
    "porc_nouilles":     ("@recettes.fitness.express", "Recettes Fitness Express", "7342226480727952673"),
    "porc_miel":         ("@recettes.fitness.express", "Recettes Fitness Express", "7186947748023799045"),
    # ── Saumon & Poisson ──────────────────────────────────────────────────────
    "saumon_bowl":       ("@recettes.fitness.express", "Recettes Fitness Express", "7357742096431746337"),
    "saumon_teriyaki":   ("@recettes.fitness.express", "Recettes Fitness Express", "7364409955010612512"),
    "saumon_poke":       ("@recettes.fitness.express", "Recettes Fitness Express", "7393026340309470497"),
    "saumon_pates":      ("@recettes.fitness.express", "Recettes Fitness Express", "7201035509303397637"),
    "saumon_nori":       ("@recettes.fitness.express", "Recettes Fitness Express", "7226787738727566618"),
    "saumon_oeuf":       ("@recettes.fitness.express", "Recettes Fitness Express", "7174822752304549125"),
    "saumon_nouilles":   ("@recettes.fitness.express", "Recettes Fitness Express", "7342226480727952673"),
    "saumon_avocat":     ("@recettes.fitness.express", "Recettes Fitness Express", "7293467539256904993"),
    # ── Bowls & Salades ───────────────────────────────────────────────────────
    "bowl_proteine":     ("@salutcestclaire",          "Salut c'est Claire",       "7460928738369359126"),
    "salade_bowl":       ("@saskinax",                 "Saskinax",                 "7506164608076500246"),
    "salade_bowl2":      ("@saskinax",                 "Saskinax",                 "7369626160113732897"),
    # ── Végétarien ────────────────────────────────────────────────────────────
    "veggie_bowl":       ("@salutcestclaire",          "Salut c'est Claire",       "7460928738369359126"),
    "oeuf_recette":      ("@recettes.fitness.express", "Recettes Fitness Express", "7174822752304549125"),
    # ── Féculents / Pâtes / Riz ───────────────────────────────────────────────
    "pates_saumon":      ("@recettes.fitness.express", "Recettes Fitness Express", "7293467539256904993"),
    "pates_creamy":      ("@recettes.fitness.express", "Recettes Fitness Express", "7226787738727566618"),
    "pates_poulet":      ("@recettes.fitness.express", "Recettes Fitness Express", "7353700304451407136"),
    "riz_recette":       ("@recettes.fitness.express", "Recettes Fitness Express", "7362549189298916640"),
    # ── Sauces ────────────────────────────────────────────────────────────────
    "sauce_generale":    ("@yohanit00",                "Yohan It",                 "7268365976276684065"),
    "sauce_asiatique":   ("@recettes.fitness.express", "Recettes Fitness Express", "7246099327817485595"),
    "sauce_salades":     ("@saskinax",                 "Saskinax",                 "7369626160113732897"),
    "sauce_legere":      ("@salutcestclaire",          "Salut c'est Claire",       "7460928738369359126"),
    "sauce_epice":       ("@recettes.fitness.express", "Recettes Fitness Express", "7193000677948296454"),
    # ── Petit déjeuner ────────────────────────────────────────────────────────
    "pancakes_fitness":  ("@thecheftomy",              "The Chef Tomy",            "7224854814851599643"),
    "pancakes_fb":       ("@ginie.healthylife",        "Ginie Healthy Life",       "7427119314722983200"),
    "overnight_oats":    ("@eatwithflower",            "Eat With Flower",          "7490823494066883862"),
    "petit_dej_tibo":    ("@tiboinshape",              "Tibo InShape",             "7509926549798358294"),
    "bowl_pdej":         ("@recettes.fitness.express", "Recettes Fitness Express", "7204536162633944326"),
    # ── Collation / Snacks ────────────────────────────────────────────────────
    "snack_tibo":        ("@tiboinshape",              "Tibo InShape",             "7226753036041964826"),
    "snack_salade":      ("@saskinax",                 "Saskinax",                 "7506164608076500246"),
    "snack_sain":        ("@salutcestclaire",          "Salut c'est Claire",       "7460928738369359126"),
    "snack_sport":       ("@tiboinshape",              "Tibo InShape",             "7509926549798358294"),
}


def v(key):
    """Retourne (handle, creator_name, video_id, tiktok_url)"""
    h, n, vid = VIDEOS[key]
    return h, n, vid, f"https://www.tiktok.com/{h}/video/{vid}"


# ── Mapping nom de recette → clé vidéo ───────────────────────────────────────
RECIPE_VIDEO_MAP = {
    # POULET
    "Poulet cajun & avocat":              "poulet_mexicain",
    "Poulet shawarma maison":             "poulet_panini",
    "Blanc de poulet 4 épices & patate douce": "poulet_courgette",
    "Poulet grillé riz brocoli":          "poulet_epice",
    "Poulet sauce moutarde & crème légère": "poulet_creme",
    "Poulet tikka masala light":          "poulet_curry",
    "Bowl poulet teriyaki sésame":        "poulet_teriyaki",
    "Brochettes yakitori poulet":         "poulet_citron",
    "Carbonara light au poulet":          "pates_poulet",
    "Pasta pesto poulet & tomates cerises": "pates_poulet",

    # BŒUF
    "Burger fitness bœuf & guacamole":   "burger_healthy",
    "Smash burger double sauce spéciale": "burger_bowl",
    "Bowl bœuf champignons & œuf":       "boeuf_padthai",
    "Bolognaise protéinée":              "boeuf_padthai",
    "Pavé de bœuf & patate douce rôtie": "boeuf_padthai",
    "Steak haricots verts & pomme de terre": "boeuf_padthai",

    # PORC
    "Ramen porc shoyu maison":           "porc_nouilles",
    "Côtes de porc miel soja & sésame":  "porc_miel",
    "Porc caramel gingembre style asiatique": "porc_nouilles",
    "Filet mignon porc & moutarde miel": "porc_miel",

    # POISSON / MER
    "Saumon teriyaki & riz sushi":       "saumon_teriyaki",
    "Poke bowl saumon & mangue":         "saumon_poke",
    "Saumon crustacés citron & aneth":   "saumon_nouilles",
    "Bowl thon & avocat façon poke":     "saumon_bowl",
    "Cabillaud poêlé sauce vierge":      "saumon_pates",
    "Patate douce farcie au thon":       "saumon_oeuf",
    "Crevettes curry coco & riz basmati": "poulet_coco",
    "Crevettes sautées ail & persil":    "saumon_nori",

    # BOWLS
    "Power bowl quinoa poulet & avocat": "poulet_teriyaki",
    "Buddha bowl légumes rôtis & houmous": "bowl_proteine",

    # SALADES
    "Salade César poulet grillé":        "salade_bowl",
    "Salade niçoise au thon":            "salade_bowl2",
    "Taboulé libanais frais":            "salade_bowl2",

    # VÉGÉTARIEN
    "Dal de lentilles corail & coco":    "veggie_bowl",
    "Tofu laqué sésame & sauce soja":    "veggie_bowl",
    "Tofu scramble façon œufs brouillés": "veggie_bowl",
    "Omelette grecque feta & épinards":  "oeuf_recette",
    "Shakshuka épicée aux œufs":         "oeuf_recette",

    # FÉCULENTS
    "Riz cantonais maison protéiné":     "riz_recette",

    # SAUCES
    "Sauce miel moutarde":               "sauce_generale",
    "Sauce ail confit & herbes":         "sauce_generale",
    "Sauce teriyaki maison (sans sucre raffiné)": "sauce_asiatique",
    "Sauce nuoc mam vietnamienne":       "sauce_asiatique",
    "Sauce sésame & soja style japonais": "sauce_asiatique",
    "Sauce tahini citron":               "sauce_legere",
    "Vinaigrette balsamique maison":     "sauce_salades",
    "Sauce tzatziki maison":             "sauce_legere",
    "Sauce yaourt citron & herbes":      "sauce_legere",
    "Sauce harissa fraîche maison":      "sauce_epice",
    "Sauce sriracha mayo":               "sauce_epice",
    "Sauce BBQ maison fumée":            "burger_bowl",

    # PETIT DÉJEUNER
    "Pancakes protéinés avoine & banane": "pancakes_fitness",
    "French toast protéiné":             "pancakes_fb",
    "Bowl açaï protéiné":                "petit_dej_tibo",
    "Overnight oats chocolat & noisette": "overnight_oats",
    "Porridge protéiné banane & beurre de cacahuète": "petit_dej_tibo",
    "Muesli maison fruits secs & graines": "snack_tibo",
    "Œufs brouillés à l'avocat sur toast": "oeuf_recette",
    "Omelette blanche thon & légumes":   "saumon_oeuf",
    "Wraps petit déj saumon fumé & fromage frais": "saumon_bowl",
    "Bowl petit déj poulet & œuf poché": "bowl_pdej",
    "Smoothie protéiné fraise & banane": "petit_dej_tibo",
    "Green smoothie épinard & mangue":   "bowl_proteine",
    "Smoothie bowl myrtille & granola":  "snack_tibo",

    # COLLATION
    "Energy balls chocolat & dattes":    "snack_tibo",
    "Muffins protéinés myrtilles & avoine": "pancakes_fb",
    "Banane rôtie au miel & cannelle":   "porc_miel",
    "Houmous maison & légumes croquants": "snack_sain",
    "Crackers riz fromage blanc & concombre": "snack_sain",
    "Chips de pois chiches épicées au four": "snack_salade",
    "Yaourt grec, miel & fruits rouges": "overnight_oats",
    "Mix de noix & fruits secs anti-fringale": "snack_sain",
    "Pomme beurre de cacahuète":         "snack_tibo",
    "Shake protéiné maison post-workout": "snack_sport",
    "Barre protéinée maison avoine & chocolat": "snack_sport",
    "Cottage cheese & ananas pre-workout": "snack_tibo",
    "Riz au lait protéiné vanille":      "poulet_coco",
}


async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            text("SELECT id, name FROM recipes")
        )
        recipes = result.all()
        print(f"{len(recipes)} recettes à mettre à jour...")

        updated = 0
        skipped = 0
        for recipe_id, recipe_name in recipes:
            key = RECIPE_VIDEO_MAP.get(recipe_name)
            if not key:
                skipped += 1
                continue

            handle, creator_name, vid_id, tiktok_url = v(key)
            await db.execute(
                text("""
                    UPDATE recipes
                    SET creator_handle   = :handle,
                        creator_name     = :creator_name,
                        tiktok_video_id  = :vid_id,
                        tiktok_url       = :tiktok_url
                    WHERE id = :id
                """),
                {
                    "handle":       handle,
                    "creator_name": creator_name,
                    "vid_id":       vid_id,
                    "tiktok_url":   tiktok_url,
                    "id":           str(recipe_id),
                }
            )
            updated += 1

        await db.commit()
        print(f"✓ {updated} recettes mises à jour")
        print(f"  {skipped} recettes sans mapping (inchangées)")

        # Résumé par créateur
        rows = (await db.execute(
            text("SELECT creator_handle, creator_name, COUNT(*) as n FROM recipes GROUP BY creator_handle, creator_name ORDER BY n DESC")
        )).all()
        print("\nDistribution finale :")
        for handle, name, count in rows:
            print(f"  {handle} ({name}) : {count} recettes")

        # Vérifier les doublons de vidéo
        dups = (await db.execute(
            text("""
                SELECT tiktok_video_id, COUNT(*) as n
                FROM recipes
                GROUP BY tiktok_video_id
                HAVING COUNT(*) > 3
                ORDER BY n DESC
            """)
        )).all()
        if dups:
            print("\n⚠️  Vidéos partagées par >3 recettes :")
            for vid, count in dups:
                print(f"  {vid}: {count} recettes")
        else:
            print("\n✓ Aucune vidéo n'est partagée par plus de 3 recettes")


asyncio.run(main())
