import uuid
from typing import Literal

from fastapi import Depends, FastAPI
from pydantic import BaseModel
from auth import get_current_user
from services import setup_profile, on_profile_update, perform_swipe
from db import get_all_users, update_profile

app = FastAPI()


class ProfileSetupRequest(BaseModel):
    username: str
    age: int
    gender: str
    preferred_gender: list[str]
    age_range: list[int]
    events: list[str]
    songs: list[str]
    movies: list[str]
    shows: list[str]
    artists: list[str]
    directors: list[str]
    music_genre: list[str]
    movie_genre: list[str]
    art: bool
    literature: list[str]


@app.post("/profile/setup")
def profile_setup(
    request: ProfileSetupRequest,
    user_id: uuid.UUID = Depends(get_current_user),
):
    setup_profile(
        user_id=user_id,
        username=request.username,
        age=request.age,
        gender=request.gender,
        preferred_gender=request.preferred_gender,
        age_range=request.age_range,
        events=request.events,
        songs=request.songs,
        movies=request.movies,
        shows=request.shows,
        artists=request.artists,
        directors=request.directors,
        music_genre=request.music_genre,
        movie_genre=request.movie_genre,
        art=request.art,
        literature=request.literature,
    )
    return {"status": "ok"}


class UpdateProfileRequest(BaseModel):
    username: str
    age: int
    gender: str
    preferred_gender: list[str]
    age_range: list[int]
    events: list[str]
    songs: list[str]
    movies: list[str]
    shows: list[str]
    artists: list[str]
    directors: list[str]
    music_genre: list[str]
    movie_genre: list[str]
    art: bool
    literature: list[str]


@app.put("/profile/update")
def profile_update(
    request: UpdateProfileRequest,
    user_id: uuid.UUID = Depends(get_current_user),
):
    all_users = get_all_users()
    user = next(user for user in all_users if user.user_id == user_id)
    user.username = request.username
    user.age = request.age
    user.gender = request.gender
    user.preferred_gender = request.preferred_gender
    user.age_range = request.age_range
    user.events = request.events
    user.songs = request.songs
    user.movies = request.movies
    user.shows = request.shows
    user.artists = request.artists
    user.directors = request.directors
    user.music_genre = request.music_genre
    user.movie_genre = request.movie_genre
    user.art = request.art
    user.literature = request.literature
    update_profile(user)
    on_profile_update(user_id)
    return {"status": "ok"}



class SwipeRequest(BaseModel):
    target_user_id: uuid.UUID
    action: Literal["like", "reject"]


@app.post("/swipe")
def swipe(
    request: SwipeRequest,
    user_id: uuid.UUID = Depends(get_current_user),
):
    all_users = get_all_users()
    current_user = next(user for user in all_users if user.user_id == user_id)
    target_user = next(user for user in all_users if user.user_id == request.target_user_id)
    return perform_swipe(current_user, target_user, request.action)


@app.get("/profile/swipes")
def get_swipes(user_id: uuid.UUID = Depends(get_current_user)):
    all_users = get_all_users()
    user = next(user for user in all_users if user.user_id == user_id)
    return {"user_ranked_list": user.user_ranked_list}
