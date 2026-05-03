import uuid
from db import get_all_users, save_ranked_list, create_profile, save_match, save_like, save_reject
from swipeAlgo import get_scored_users
from matchAlgo import create_match, is_mutual_like
from user import User


def _compute_and_save(user, all_users):
    ranked = get_scored_users(user, all_users)
    ranked_list = [{"user_id": str(u.user_id), "score": score} for u, score in ranked]
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


def on_profile_update(updated_user_id: uuid.UUID):
    all_users = get_all_users()
    updated_user = next(user for user in all_users if user.user_id == updated_user_id)

    _compute_and_save(updated_user, all_users)

    for user in all_users:
        already_ranked = any(entry["user_id"] == str(updated_user_id) for entry in user.user_ranked_list)
        if already_ranked and user.user_id != updated_user_id:
            _compute_and_save(user, all_users)


def setup_profile(
    user_id: uuid.UUID,
    username: str,
    age: int,
    gender: str,
    preferred_gender: list[str],
    age_range: tuple[int, int],
    events: list[str],
    songs: list[str],
    movies: list[str],
    artists: list[str],
    directors: list[str],
    music_genre: list[str],
    movie_genre: list[str],
    shows: list[str],
    art: bool,
    literature: list[str],
):
    user = User(
        user_id=user_id,
        username=username,
        age=age,
        gender=gender,
        preferred_gender=preferred_gender,
        user_ranked_list=[],
        blocked_users=[],
        rejected_users=[],
        liked_users=[],
        matched_users=[],
        age_range=age_range,
        events=events,
        songs=songs,
        movies=movies,
        artists=artists,
        directors=directors,
        music_genre=music_genre,
        movie_genre=movie_genre,
        shows=shows,
        art=art,
        literature=literature,
    )
    create_profile(user)
    on_profile_update(user.user_id)


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


def build_all_ranked_lists():
    all_users = get_all_users()
    for user in all_users:
        _compute_and_save(user, all_users)
