import logging

import httpx
from fastapi import HTTPException, status

from app.config import settings

logger = logging.getLogger(__name__)


async def decode_supabase_jwt(token: str) -> dict:
    """Valide le token via l'API Supabase Auth — fiable sans avoir à gérer le secret."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{settings.SUPABASE_URL}/auth/v1/user",
            headers={
                "Authorization": f"Bearer {token}",
                "apikey": settings.SUPABASE_ANON_KEY,
            },
        )

    if resp.status_code != 200:
        logger.warning(f"Supabase token validation failed: {resp.status_code} {resp.text}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return resp.json()
