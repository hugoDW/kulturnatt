import logging
import os
import uuid
from datetime import date

import requests
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException
from pydantic import BaseModel

from auth import get_current_user
from db import (
    create_profile,
    get_all_users,
    get_user,
    reset_user_swipes,
    save_like,
    save_match,
    save_ranked_list,
    save_reject,
    update_profile,
)
from internal_auth import INTERNAL_SECRET, require_internal_secret
from user import User, user_to_dict
from external_api import (
    ExternalApiError,
    get_kulturbiljett_event,
    get_tmdb_movie,
    get_tmdb_person,
    get_tmdb_tv,
    list_kulturbiljett_events,
    list_ticketmaster_events,
    search_album,
    search_artist,
    search_music,
    search_song,
    search_tmdb,
)

load_dotenv()

# url till matching-service, läses från env (sätts i docker-compose / fly.io)
MATCHING_SERVICE_URL = os.environ.get("MATCHING_SERVICE_URL", "http://matching-service:8002")

app = FastAPI()
logger = logging.getLogger(__name__)


@app.get("/health")
def health():
    return {"status": "ok"}


# triggar matching-service att räkna om ranked list när en profil ändras eller skapas
def trigger_recompute(user_id: uuid.UUID):
    try:
        response = requests.post(
            f"{MATCHING_SERVICE_URL}/internal/recompute/{user_id}",
            headers={"X-Internal-Secret": INTERNAL_SECRET},
            timeout=30,
        )
        if response.status_code != 200:
            logger.warning(
                "Matching recompute failed for %s: %s %s",
                user_id,
                response.status_code,
                response.text,
            )
    except requests.RequestException as error:
        logger.warning(
            "Matching recompute request failed for %s: %s",
            user_id,
            error,
        )


class ProfileSetupRequest(BaseModel):
    username: str
    dob: str
    gender: str
    preferred_gender: list[str]
    age_range: list[int]
    events: list[str]
    songs: list[str]
    albums: list[str] = []
    movies: list[str]
    shows: list[str]
    artists: list[str]
    directors: list[str]
    actors: list[str] = []
    music_genre: list[str]
    movie_genre: list[str]
    art: bool
    literature: list[str]
    bio: str = ""
    profile_image_uri: str | None = None
    location: str = ""
    social_media: str = ""


def profile_setup_response(user: User) -> dict:
    return {
        "username": user.username,
        "dob": user.dob.isoformat(),
        "gender": user.gender,
        "preferred_gender": user.preferred_gender,
        "age_range": list(user.age_range),
        "events": user.events,
        "songs": user.songs,
        "albums": user.albums,
        "movies": user.movies,
        "shows": user.shows,
        "artists": user.artists,
        "directors": user.directors,
        "actors": user.actors,
        "music_genre": user.music_genre,
        "movie_genre": user.movie_genre,
        "art": user.art,
        "literature": user.literature,
        "bio": user.bio,
        "profile_image_uri": user.profile_image_uri,
        "location": user.location,
    }


def swipe_profile_response(user: User, score: int) -> dict:
    return {
        **profile_setup_response(user),
        "user_id": str(user.user_id),
        "score": score,
    }


def apply_profile_setup_request(user: User, request: ProfileSetupRequest) -> User:
    user.username = request.username
    user.dob = date.fromisoformat(request.dob)
    user.gender = request.gender
    user.preferred_gender = request.preferred_gender
    user.age_range = tuple(request.age_range)
    user.events = request.events
    user.songs = request.songs
    user.albums = request.albums
    user.movies = request.movies
    user.shows = request.shows
    user.artists = request.artists
    user.directors = request.directors
    user.actors = request.actors
    user.music_genre = request.music_genre
    user.movie_genre = request.movie_genre
    user.art = request.art
    user.literature = request.literature
    user.bio = request.bio
    user.profile_image_uri = request.profile_image_uri
    user.location = request.location
    user.social_media = request.social_media
    return user


@app.get("/profile/me")
def profile_me(user_id: uuid.UUID = Depends(get_current_user)):
    user = get_user(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    # Own profile — include social_media so the user can view/edit it.
    return {**profile_setup_response(user), "social_media": user.social_media}


@app.post("/profile/setup")
def profile_setup(
    request: ProfileSetupRequest,
    user_id: uuid.UUID = Depends(get_current_user),
):
    # skapa user-objekt och spara i databasen
    user = User(
        user_id=user_id,
        username=request.username,
        dob=date.fromisoformat(request.dob),
        gender=request.gender,
        preferred_gender=request.preferred_gender,
        user_ranked_list=[],
        blocked_users=[],
        rejected_users=[],
        liked_users=[],
        matched_users=[],
        age_range=tuple(request.age_range),
        events=request.events,
        songs=request.songs,
        albums=request.albums,
        movies=request.movies,
        artists=request.artists,
        directors=request.directors,
        actors=request.actors,
        music_genre=request.music_genre,
        movie_genre=request.movie_genre,
        shows=request.shows,
        art=request.art,
        literature=request.literature,
        bio=request.bio,
        profile_image_uri=request.profile_image_uri,
        location=request.location,
        social_media=request.social_media,
    )
    try:
        create_profile(user)
    except RuntimeError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error
    trigger_recompute(user_id)
    return {"status": "ok"}


class UpdateProfileRequest(BaseModel):
    username: str
    dob: str
    gender: str
    preferred_gender: list[str]
    age_range: list[int]
    events: list[str]
    songs: list[str]
    albums: list[str] = []
    movies: list[str]
    shows: list[str]
    artists: list[str]
    directors: list[str]
    actors: list[str] = []
    music_genre: list[str]
    movie_genre: list[str]
    art: bool
    literature: list[str]
    bio: str = ""
    profile_image_uri: str | None = None
    location: str = ""
    social_media: str = ""


@app.put("/profile/update")
def profile_update(
    request: UpdateProfileRequest,
    user_id: uuid.UUID = Depends(get_current_user),
):
    user = get_user(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Profile not found")
    user.username = request.username
    user.dob = date.fromisoformat(request.dob)
    user.gender = request.gender
    user.preferred_gender = request.preferred_gender
    user.age_range = tuple(request.age_range)
    user.events = request.events
    user.songs = request.songs
    user.albums = request.albums
    user.movies = request.movies
    user.shows = request.shows
    user.artists = request.artists
    user.directors = request.directors
    user.actors = request.actors
    user.music_genre = request.music_genre
    user.movie_genre = request.movie_genre
    user.art = request.art
    user.literature = request.literature
    user.bio = request.bio
    user.profile_image_uri = request.profile_image_uri
    user.location = request.location
    user.social_media = request.social_media
    try:
        update_profile(user)
    except RuntimeError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error
    trigger_recompute(user_id)
    return {"status": "ok"}


@app.post("/profile/reset_swipes")
def profile_reset_swipes(user_id: uuid.UUID = Depends(get_current_user)):
    user = get_user(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Profile not found")

    partner_updates: list[tuple[uuid.UUID, list, list]] = []
    for matched_id in user.matched_users:
        other = get_user(matched_id)
        if other is None:
            continue
        next_liked = other.liked_users + (
            [user_id] if user_id not in other.liked_users else []
        )
        next_matched = [
            partner for partner in other.matched_users if partner != user_id
        ]
        partner_updates.append((other.user_id, next_liked, next_matched))

    reset_user_swipes(user_id, partner_updates)
    trigger_recompute(user_id)
    return {"status": "ok"}


@app.get("/profile/matches")
def profile_matches(user_id: uuid.UUID = Depends(get_current_user)):
    user = get_user(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Profile not found")

    profiles_by_id = {str(other.user_id): other for other in get_all_users()}
    matches = []
    for matched_id in user.matched_users:
        other = profiles_by_id.get(str(matched_id))
        if other is None:
            continue
        matches.append({
            **profile_setup_response(other),
            "user_id": str(other.user_id),
            # social_media is only shared with matched users.
            "social_media": other.social_media,
        })
    return {"matches": matches}


@app.get("/profile/swipes")
def profile_swipes(user_id: uuid.UUID = Depends(get_current_user)):
    user = get_user(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Profile not found")

    profiles_by_id = {str(other.user_id): other for other in get_all_users()}
    already_seen = {
        *{str(other_id) for other_id in user.liked_users},
        *{str(other_id) for other_id in user.rejected_users},
        *{str(other_id) for other_id in user.matched_users},
    }
    enriched = []

    for entry in user.user_ranked_list:
        other_id = entry.get("user_id", "")
        if other_id in already_seen:
            continue
        other = profiles_by_id.get(other_id)
        if other is None:
            continue
        enriched.append(
            swipe_profile_response(other, entry.get("score", 0)),
        )

    return {"user_ranked_list": enriched}


def raise_external_api_error(error: ExternalApiError):
    raise HTTPException(status_code=error.status_code, detail=str(error))


def validate_external_limit(limit: int):
    if limit < 1 or limit > 20:
        raise HTTPException(status_code=400, detail="limit must be between 1 and 20")


@app.get("/external/events", dependencies=[Depends(get_current_user)])
def external_events(query: str | None = None, city: str | None = None):
    try:
        return {"events": list_kulturbiljett_events(query, city)}
    except ExternalApiError as error:
        raise_external_api_error(error)


@app.get("/external/events/{event_id}", dependencies=[Depends(get_current_user)])
def external_event(event_id: str):
    try:
        return get_kulturbiljett_event(event_id)
    except ExternalApiError as error:
        raise_external_api_error(error)


@app.get("/external/ticketmaster/events", dependencies=[Depends(get_current_user)])
def external_ticketmaster_events(query: str | None = None, city: str | None = None):
    try:
        return {"events": list_ticketmaster_events(query, city)}
    except ExternalApiError as error:
        raise_external_api_error(error)


@app.get("/external/music/search", dependencies=[Depends(get_current_user)])
def external_music_search(query: str, category: str = "artist", limit: int = 5):
    validate_external_limit(limit)
    try:
        return {"results": search_music(query, category, limit)}
    except ExternalApiError as error:
        raise_external_api_error(error)


@app.get("/external/music/artists/search", dependencies=[Depends(get_current_user)])
def external_artist_search(query: str, limit: int = 5):
    validate_external_limit(limit)
    try:
        return {"results": search_artist(query, limit)}
    except ExternalApiError as error:
        raise_external_api_error(error)


@app.get("/external/music/songs/search", dependencies=[Depends(get_current_user)])
def external_song_search(query: str, limit: int = 5):
    validate_external_limit(limit)
    try:
        return {"results": search_song(query, limit)}
    except ExternalApiError as error:
        raise_external_api_error(error)


@app.get("/external/music/albums/search", dependencies=[Depends(get_current_user)])
def external_album_search(query: str, limit: int = 5):
    validate_external_limit(limit)
    try:
        return {"results": search_album(query, limit)}
    except ExternalApiError as error:
        raise_external_api_error(error)


@app.get("/external/tmdb/search", dependencies=[Depends(get_current_user)])
def external_tmdb_search(query: str, category: str = "movie"):
    try:
        return {"results": search_tmdb(query, category)}
    except ExternalApiError as error:
        raise_external_api_error(error)


@app.get("/external/tmdb/movies/{movie_id}", dependencies=[Depends(get_current_user)])
def external_tmdb_movie(movie_id: int):
    try:
        return get_tmdb_movie(movie_id)
    except ExternalApiError as error:
        raise_external_api_error(error)


@app.get("/external/tmdb/tv/{show_id}", dependencies=[Depends(get_current_user)])
def external_tmdb_tv(show_id: int):
    try:
        return get_tmdb_tv(show_id)
    except ExternalApiError as error:
        raise_external_api_error(error)


@app.get("/external/tmdb/people/{person_id}", dependencies=[Depends(get_current_user)])
def external_tmdb_person(person_id: int):
    try:
        return get_tmdb_person(person_id)
    except ExternalApiError as error:
        raise_external_api_error(error)


# === interna routes som bara matching-service ska kunna nå ===
# alla skyddade med shared secret via require_internal_secret


@app.get("/internal/users", dependencies=[Depends(require_internal_secret)])
def internal_get_users():
    # matching-service kallar denna för att hämta alla användare
    return [user_to_dict(user) for user in get_all_users()]


@app.get("/internal/users/{user_id}", dependencies=[Depends(require_internal_secret)])
def internal_get_user(user_id: uuid.UUID):
    # hämta en specifik användare via id
    user = get_user(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user_to_dict(user)


class RankedListUpdate(BaseModel):
    ranked_list: list[dict]


@app.put("/internal/users/{user_id}/ranked_list", dependencies=[Depends(require_internal_secret)])
def internal_save_ranked_list(user_id: uuid.UUID, body: RankedListUpdate):
    # matching-service skickar hit den nya ranked listan efter omräkning
    save_ranked_list(user_id, body.ranked_list)
    return {"status": "ok"}


class LikesUpdate(BaseModel):
    liked_users: list[uuid.UUID]


@app.put("/internal/users/{user_id}/likes", dependencies=[Depends(require_internal_secret)])
def internal_save_likes(user_id: uuid.UUID, body: LikesUpdate):
    # spara vilka användare en person har gillat
    save_like(user_id, body.liked_users)
    return {"status": "ok"}


class RejectsUpdate(BaseModel):
    rejected_users: list[uuid.UUID]


@app.put("/internal/users/{user_id}/rejects", dependencies=[Depends(require_internal_secret)])
def internal_save_rejects(user_id: uuid.UUID, body: RejectsUpdate):
    # spara vilka användare en person har swipat bort
    save_reject(user_id, body.rejected_users)
    return {"status": "ok"}


class MatchUpdate(BaseModel):
    user_a_id: uuid.UUID
    a_liked: list[uuid.UUID]
    a_matched: list[uuid.UUID]
    user_b_id: uuid.UUID
    b_liked: list[uuid.UUID]
    b_matched: list[uuid.UUID]


@app.post("/internal/match", dependencies=[Depends(require_internal_secret)])
def internal_save_match(body: MatchUpdate):
    # uppdatera båda användarnas liked_users och matched_users när det blir match
    save_match(
        body.user_a_id, body.a_liked, body.a_matched,
        body.user_b_id, body.b_liked, body.b_matched,
    )
    return {"status": "ok"}


if __name__ == "__main__":
    # Dual-stack bind: gateway reaches us over IPv6 (fdaa::...),
    # Fly's machine-level healthcheck probes over IPv4.
    import socket
    import uvicorn

    sock = socket.create_server(
        ("", 8001),
        family=socket.AF_INET6,
        dualstack_ipv6=True,
    )
    uvicorn.run(app, fd=sock.fileno())
