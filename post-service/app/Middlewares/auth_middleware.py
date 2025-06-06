from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
from httpx import AsyncClient
from fastapi.exceptions import HTTPException
from starlette.status import HTTP_401_UNAUTHORIZED, HTTP_500_INTERNAL_SERVER_ERROR

from app.Config.config import API_GATEWAY_URL


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Bỏ qua một số route public như /docs, /openapi.json, /redoc
        public_paths = ["/docs", "/openapi.json", "/redoc"]
        if request.url.path in public_paths:
            return await call_next(request)

        authorization: str = request.headers.get("Authorization")
        if authorization and authorization.startswith("Bearer "):
            token = authorization.replace("Bearer ", "")
            try:
                async with AsyncClient() as client:
                    response = await client.get(
                        f"{API_GATEWAY_URL}/auth/me",
                        headers={"Authorization": f"Bearer {token}"}
                    )
                    if response.status_code == 200:
                        request.state.user = response.json().get("data")
                        request.state.token = token
                    else:
                        raise HTTPException(
                            status_code=HTTP_401_UNAUTHORIZED,
                            detail="Invalid token or user not authenticated.",
                        )
            except Exception as e:
                raise HTTPException(
                    status_code=HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Auth service error: {str(e)}"
                )
        else:
            raise HTTPException(
                status_code=HTTP_401_UNAUTHORIZED,
                detail="Authorization header missing or invalid"
            )

        return await call_next(request)

