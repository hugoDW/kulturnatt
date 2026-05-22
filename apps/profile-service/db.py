import logging
import uuid
import os
from datetime import date
from dotenv import load_dotenv
from supabase import create_client, Client
from user import User

load_dotenv()
logger = logging.getLogger(__name__)
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)


def _execute(query, action: str):
    try:
        return query.execute()
    except Exception as error:
        logger.exception("Supabase %s failed", action)
        raise RuntimeError(f"Database {action} failed: {error}") from error


def row_to_user(row: dict) -> User:
    return User(
        user_id=uuid.UUID(row["id_profile"]),
        username=row["username"],
        dob=date.fromisoformat(row["dob"]),
        gender=row["gender"],
        preferred_gender=row["preferred_gender"] or [],
        user_ranked_list=row["user_ranked_list"] or [],
        blocked_users=[uuid.UUID(user) for user in (row["blocked_users"] or [])],
        rejected_users=[uuid.UUID(user) for user in (row["rejected_users"] or [])],
        liked_users=[uuid.UUID(user) for user in (row["liked_users"] or [])],
        matched_users=[uuid.UUID(user) for user in (row["matched_users"] or [])],
        age_range=tuple(row["age_range"] or [0, 99]),
        events=row["events"] or [],
        songs=row["songs"] or [],
        albums=row.get("albums") or [],
        movies=row["movies"] or [],
        artists=row["artists"] or [],
        directors=row["directors"] or [],
        actors=row.get("actors") or [],
        music_genre=row["music_genre"] or [],
        movie_genre=row["movie_genre"] or [],
        shows=row["shows"] or [],
        art=row["art"] or False,
        literature=row["literature"] or [],
        bio=row.get("bio") or "",
        profile_image_uri=row.get("profile_image_uri"),
        location=row.get("location") or "",
    )


def get_all_users() -> list[User]:
    response = supabase.table("profile").select("*").execute()
    return [row_to_user(row) for row in response.data]


# hämtar en specifik användare via id, returnerar None om hen inte finns
def get_user(user_id: uuid.UUID) -> User | None:
    response = supabase.table("profile").select("*").eq("id_profile", str(user_id)).execute()
    if not response.data:
        return None
    return row_to_user(response.data[0])


def save_ranked_list(user_id: uuid.UUID, ranked_list: list[dict]):
    _execute(
        supabase.table("profile")
        .update({"user_ranked_list": ranked_list})
        .eq("id_profile", str(user_id)),
        "ranked list update",
    )


def update_profile(user: User):
    _execute(
        supabase.table("profile").update({
            "username": user.username,
            "dob": user.dob.isoformat(),
            "gender": user.gender,
            "preferred_gender": user.preferred_gender,
            "age_range": list(user.age_range),
            "events": user.events,
            "songs": user.songs,
            "albums": user.albums,
            "movies": user.movies,
            "artists": user.artists,
            "directors": user.directors,
            "actors": user.actors,
            "music_genre": user.music_genre,
            "movie_genre": user.movie_genre,
            "shows": user.shows,
            "art": user.art,
            "literature": user.literature,
            "bio": user.bio,
            "profile_image_uri": user.profile_image_uri,
            "location": user.location,
        }).eq("id_profile", str(user.user_id)),
        "profile update",
    )


def create_profile(user: User):
    existing = (
        supabase.table("profile")
        .select("id_profile")
        .eq("id_profile", str(user.user_id))
        .execute()
    )

    if existing.data:
        # Profile already exists — only update editable fields so we don't
        # wipe liked_users / matched_users / etc.
        update_profile(user)
        return

    _execute(
        supabase.table("profile").insert({
            "id_profile": str(user.user_id),
            "username": user.username,
            "dob": user.dob.isoformat(),
            "gender": user.gender,
            "preferred_gender": user.preferred_gender,
            "user_ranked_list": [],
            "blocked_users": [],
            "rejected_users": [],
            "liked_users": [],
            "matched_users": [],
            "age_range": list(user.age_range),
            "events": user.events,
            "songs": user.songs,
            "albums": user.albums,
            "movies": user.movies,
            "artists": user.artists,
            "directors": user.directors,
            "actors": user.actors,
            "music_genre": user.music_genre,
            "movie_genre": user.movie_genre,
            "shows": user.shows,
            "art": user.art,
            "literature": user.literature,
            "bio": user.bio,
            "profile_image_uri": user.profile_image_uri,
            "location": user.location,
        }),
        "profile insert",
    )


def save_match(
    user_a_id: uuid.UUID, a_liked: list, a_matched: list,
    user_b_id: uuid.UUID, b_liked: list, b_matched: list,
):
    supabase.table("profile").update({
        "liked_users": [str(user) for user in a_liked],
        "matched_users": [str(user) for user in a_matched],
    }).eq("id_profile", str(user_a_id)).execute()
    supabase.table("profile").update({
        "liked_users": [str(user) for user in b_liked],
        "matched_users": [str(user) for user in b_matched],
    }).eq("id_profile", str(user_b_id)).execute()


def save_like(user_id: uuid.UUID, liked_users: list):
    supabase.table("profile").update({
        "liked_users": [str(user) for user in liked_users],
    }).eq("id_profile", str(user_id)).execute()


def save_reject(user_id: uuid.UUID, rejected_users: list):
    supabase.table("profile").update({
        "rejected_users": [str(user) for user in rejected_users],
    }).eq("id_profile", str(user_id)).execute()
