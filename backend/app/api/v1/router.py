from fastapi import APIRouter

from app.api.v1 import auth, calendar, library, macros, plan, profile, tracker, water

router = APIRouter(prefix="/api/v1")
router.include_router(auth.router)
router.include_router(profile.router)
router.include_router(macros.router)
router.include_router(plan.router)
router.include_router(tracker.router)
router.include_router(library.router)
router.include_router(calendar.router)
router.include_router(water.router)
