from app.tasks.celery_app import celery_app


@celery_app.task(name="generate_meal_plan")
def generate_meal_plan(user_id: str) -> dict:
    # Placeholder — logique de génération via Claude à implémenter
    return {"status": "queued", "user_id": user_id}
