import uuid
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_supabase_jwt
from app.db.session import get_db

bearer_scheme = HTTPBearer()


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


DBDep = Annotated[AsyncSession, Depends(get_db)]
CurrentUserDep = Annotated[uuid.UUID, Depends(get_current_user_id)]
