import os
import uuid

import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

load_dotenv()

JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
JWKS_URL = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json" if SUPABASE_URL else None
ASYMMETRIC_ALGORITHMS = {"ES256", "RS256"}

security = HTTPBearer()

_jwks_client = jwt.PyJWKClient(JWKS_URL) if JWKS_URL else None


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> uuid.UUID:
    token = credentials.credentials
    try:
        algorithm = jwt.get_unverified_header(token).get("alg", "HS256")

        if algorithm in ASYMMETRIC_ALGORITHMS:
            if _jwks_client is None:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="SUPABASE_URL not configured for JWKS verification",
                )
            signing_key = _jwks_client.get_signing_key_from_jwt(token).key
            payload = jwt.decode(
                token,
                signing_key,
                algorithms=[algorithm],
                audience="authenticated",
            )
        else:
            payload = jwt.decode(
                token,
                JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated",
            )

        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return uuid.UUID(user_id)
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
