import uuid

from fastapi import APIRouter

from app.dependencies import CurrentUserDep

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me")
async def get_me(current_user_id: CurrentUserDep) -> dict:
    return {"user_id": str(current_user_id)}
