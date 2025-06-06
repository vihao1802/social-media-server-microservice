from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from httpx import AsyncClient, RequestError
from starlette.status import HTTP_401_UNAUTHORIZED, HTTP_500_INTERNAL_SERVER_ERROR

from app.Config.config import API_GATEWAY_URL

# HTTP Bearer Token Security Scheme
security = HTTPBearer()

async def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):

    token = credentials.credentials  # Extract token from Authorization header
    auth_service_url = f"{API_GATEWAY_URL}/auth/me"  # URL of auth service

    async with AsyncClient() as client:
        try:
            # Send the request to the Auth service
            response = await client.get(
                auth_service_url,
                headers={"Authorization": f"Bearer {token}"}
            )

            # Check if the response is successful
            if response.status_code == 200:
                user_data = response.json().get("data")
                if user_data:
                    return {
                        "current_user": user_data,
                        "token": token
                    }  # Return user data if token is valid

            # If response status is not 200 or data is missing, raise exception
            raise HTTPException(
                status_code=HTTP_401_UNAUTHORIZED,
                detail="Invalid token or user not authenticated."
            )

        except RequestError as e:
            # Handle connection errors or other request-related issues
            raise HTTPException(
                status_code=HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error connecting to Auth service: {str(e)}"
            )
