import uuid
from typing import Literal

from fastapi import Depends, FastAPI, HTTPException
from pydantic import BaseModel

from auth import get_current_user
from internal_auth import require_internal_secret
from profile_client import get_user
from services import perform_swipe, recompute_for_user

app = FastAPI()


@app.get("/health")
def health():
    return {"status": "ok"}


class SwipeRequest(BaseModel):
    target_user_id: uuid.UUID
    action: Literal["like", "reject"]


@app.post("/swipe")
def swipe(
    request: SwipeRequest,
    user_id: uuid.UUID = Depends(get_current_user),
):
    # hämtar båda användarna via profile-service och kör swipe-logiken
    current_user = get_user(user_id)
    target_user = get_user(request.target_user_id)
    if current_user is None or target_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return perform_swipe(current_user, target_user, request.action)


# intern route — kallas av profile-service efter att en profil har sparats eller uppdaterats
@app.post("/internal/recompute/{user_id}", dependencies=[Depends(require_internal_secret)])
def internal_recompute(user_id: uuid.UUID):
    recompute_for_user(user_id)
    return {"status": "ok"}
