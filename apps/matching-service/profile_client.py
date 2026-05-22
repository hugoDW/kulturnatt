# HTTP-klient mot profile-service
# matching-service har ingen egen databasaccess, all data hämtas och sparas via dessa anrop
import os
import uuid

import requests
from dotenv import load_dotenv

from internal_auth import INTERNAL_SECRET
from user import User, user_from_dict

load_dotenv()

# url till profile-service, läses från env (sätts i docker-compose / fly.io)
PROFILE_SERVICE_URL = os.environ.get("PROFILE_SERVICE_URL", "http://profile-service:8001")


# hämtar alla användare från profile-service
def get_all_users() -> list[User]:
    response = requests.get(
        f"{PROFILE_SERVICE_URL}/internal/users",
        headers={"X-Internal-Secret": INTERNAL_SECRET},
        timeout=30,
    )
    response.raise_for_status()
    return [user_from_dict(item) for item in response.json()]


# hämtar en specifik användare, returnerar None om användaren inte finns
def get_user(user_id: uuid.UUID) -> User | None:
    response = requests.get(
        f"{PROFILE_SERVICE_URL}/internal/users/{user_id}",
        headers={"X-Internal-Secret": INTERNAL_SECRET},
        timeout=30,
    )
    if response.status_code == 404:
        return None
    response.raise_for_status()
    return user_from_dict(response.json())


# sparar ny ranked list för en användare
def save_ranked_list(user_id: uuid.UUID, ranked_list: list[dict]):
    response = requests.put(
        f"{PROFILE_SERVICE_URL}/internal/users/{user_id}/ranked_list",
        headers={"X-Internal-Secret": INTERNAL_SECRET},
        json={"ranked_list": ranked_list},
        timeout=30,
    )
    response.raise_for_status()


# sparar liked_users för en användare
def save_like(user_id: uuid.UUID, liked_users: list[uuid.UUID]):
    requests.put(
        f"{PROFILE_SERVICE_URL}/internal/users/{user_id}/likes",
        headers={"X-Internal-Secret": INTERNAL_SECRET},
        json={"liked_users": [str(other) for other in liked_users]},
    )


# sparar rejected_users för en användare
def save_reject(user_id: uuid.UUID, rejected_users: list[uuid.UUID]):
    requests.put(
        f"{PROFILE_SERVICE_URL}/internal/users/{user_id}/rejects",
        headers={"X-Internal-Secret": INTERNAL_SECRET},
        json={"rejected_users": [str(other) for other in rejected_users]},
    )


# vid match: uppdaterar både liked_users och matched_users för båda användarna
def save_match(
    user_a_id: uuid.UUID, a_liked: list[uuid.UUID], a_matched: list[uuid.UUID],
    user_b_id: uuid.UUID, b_liked: list[uuid.UUID], b_matched: list[uuid.UUID],
):
    requests.post(
        f"{PROFILE_SERVICE_URL}/internal/match",
        headers={"X-Internal-Secret": INTERNAL_SECRET},
        json={
            "user_a_id": str(user_a_id),
            "a_liked": [str(other) for other in a_liked],
            "a_matched": [str(other) for other in a_matched],
            "user_b_id": str(user_b_id),
            "b_liked": [str(other) for other in b_liked],
            "b_matched": [str(other) for other in b_matched],
        },
    )
