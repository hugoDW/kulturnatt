# samma logik som tidigare men databasanropen går nu via profile_client (HTTP)
# istället för direkt mot Supabase, eftersom profile-service äger databasen
import uuid

from matchAlgo import create_match, is_mutual_like
from profile_client import (
    get_all_users,
    save_like,
    save_match,
    save_ranked_list,
    save_reject,
)
from swipeAlgo import get_scored_users
from user import User


def _compute_and_save(user, all_users):
    ranked = get_scored_users(user, all_users)
    ranked_list = [{"user_id": str(other.user_id), "score": score} for other, score in ranked]
    save_ranked_list(user.user_id, ranked_list)


def perform_match(user_a: User, user_b: User) -> dict | None:
    if not is_mutual_like(user_a, user_b):
        return None
    new_a_liked = [user for user in user_a.liked_users if user != user_b.user_id]
    new_b_liked = [user for user in user_b.liked_users if user != user_a.user_id]
    new_a_matched = user_a.matched_users + [user_b.user_id]
    new_b_matched = user_b.matched_users + [user_a.user_id]
    save_match(user_a.user_id, new_a_liked, new_a_matched,
               user_b.user_id, new_b_liked, new_b_matched)
    return create_match(user_a, user_b)


# räknar om ranked list för alla användare när en profil har sparats eller uppdaterats
# kallas av matching-service /internal/recompute när profile-service har sparat en ändring
def recompute_for_user(updated_user_id: uuid.UUID):
    all_users = get_all_users()
    updated_user = next((user for user in all_users if user.user_id == updated_user_id), None)
    if updated_user is None:
        return

    for user in all_users:
        _compute_and_save(user, all_users)


def perform_swipe(current_user: User, target_user: User, action: str) -> dict:
    if action == "like":
        new_liked = current_user.liked_users + [target_user.user_id]
        save_like(current_user.user_id, new_liked)
        current_user.liked_users = new_liked
        if current_user.user_id in target_user.liked_users:
            result = perform_match(current_user, target_user)
            if result:
                return {"status": "match", "shared": result["shared"]}
        return {"status": "liked"}
    else:
        new_rejected = current_user.rejected_users + [target_user.user_id]
        save_reject(current_user.user_id, new_rejected)
        return {"status": "rejected"}
