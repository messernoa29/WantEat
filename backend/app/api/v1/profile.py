from fastapi import APIRouter
from sqlalchemy import select

from app.db.models.user import UserProfile
from app.dependencies import CurrentUserDep, DBDep
from app.core.exceptions import NotFoundError
from app.schemas.profile import ProfileCreate, ProfileRead

router = APIRouter(prefix="/profile", tags=["profile"])


@router.post("", response_model=ProfileRead, status_code=201)
async def create_or_update_profile(
    data: ProfileCreate,
    user_id: CurrentUserDep,
    db: DBDep,
) -> UserProfile:
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = result.scalar_one_or_none()

    if profile:
        for field, value in data.model_dump().items():
            setattr(profile, field, value)
    else:
        profile = UserProfile(user_id=user_id, **data.model_dump())
        db.add(profile)

    await db.commit()
    await db.refresh(profile)
    return profile


@router.get("", response_model=ProfileRead)
async def get_profile(user_id: CurrentUserDep, db: DBDep) -> UserProfile:
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise NotFoundError("Profil non trouvé")
    return profile
