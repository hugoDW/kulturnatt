# kollar att rätt hemlig nyckel skickas med på interna routes
# används så att bara matching-service kan kalla på /internal/* endpoints
import os

from dotenv import load_dotenv
from fastapi import Header, HTTPException

load_dotenv()

# delad hemlighet mellan profile-service och matching-service, sätts som env-variabel
INTERNAL_SECRET = os.environ.get("INTERNAL_SECRET")


def require_internal_secret(x_internal_secret: str = Header(default=None)):
    # om headern saknas eller är fel, neka anropet med 403
    if x_internal_secret != INTERNAL_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")
