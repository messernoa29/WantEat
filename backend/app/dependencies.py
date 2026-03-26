import uuid
from typing import Annotated, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_supabase_jwt
from app.db.session import get_db

bearer_scheme = HTTPBearer()
bearer_scheme_optional = HTTPBearer(auto_error=False)


async def get_current_user_id(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
) -> uuid.UUID:
    payload = await decode_supabase_jwt(credentials.credentials)
    user_id = payload.get("id") or payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload"
        )
    return uuid.UUID(user_id)


async def get_optional_user_id(
    credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(bearer_scheme_optional)],
) -> Optional[uuid.UUID]:
    if not credentials:
        return None
    try:
        payload = await decode_supabase_jwt(credentials.credentials)
        user_id = payload.get("id") or payload.get("sub")
        return uuid.UUID(user_id) if user_id else None
    except Exception:
        return None


DBDep = Annotated[AsyncSession, Depends(get_db)]
CurrentUserDep = Annotated[uuid.UUID, Depends(get_current_user_id)]
OptionalUserDep = Annotated[Optional[uuid.UUID], Depends(get_optional_user_id)]
