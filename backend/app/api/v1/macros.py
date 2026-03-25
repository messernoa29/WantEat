from fastapi import APIRouter
from sqlalchemy import select

from app.db.models.user import UserProfile
from app.dependencies import CurrentUserDep, DBDep
from app.core.exceptions import NotFoundError
from app.schemas.macros import MacrosRead
from app.services.macros_service import calculate_macros

router = APIRouter(prefix="/macros", tags=["macros"])


@router.get("", response_model=MacrosRead)
async def get_macros(user_id: CurrentUserDep, db: DBDep) -> MacrosRead:
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise NotFoundError("Profil non trouvé — crée ton profil d'abord")
    return calculate_macros(profile)
