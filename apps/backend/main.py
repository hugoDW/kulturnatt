import uuid

from fastapi import FastAPI
from pydantic import BaseModel
from services import setup_profile, on_profile_update, perform_match
from db import get_all_users, update_profile

app = FastAPI()

class ProfileSetupRequest(BaseModel):
    user_id: uuid.UUID
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
def profile_setup(request: ProfileSetupRequest):
    setup_profile(
        user_id = request.user_id,
        username = request.username,
        age = request.age,
        gender = request.gender,
        preferred_gender = request.preferred_gender,
        age_range = request.age_range,
        events = request.events,
        songs = request.songs,
        movies = request.movies,
        shows = request.shows,
        artists = request.artists,
        directors = request.directors,
        music_genre = request.music_genre,
        movie_genre = request.movie_genre,
        art = request.art,
        literature = request.literature,
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


class MatchRequest(BaseModel):
    user_a_id: uuid.UUID
    user_b_id: uuid.UUID


@app.put("/profile/update/{user_id}")
def profile_update(user_id: uuid.UUID, request: UpdateProfileRequest):
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


@app.post("/match")
def match(request: MatchRequest):
    all_users = get_all_users()
    user_a = next(user for user in all_users if user.user_id == request.user_a_id)
    user_b = next(user for user in all_users if user.user_id == request.user_b_id)
    result = perform_match(user_a, user_b)
    return result if result else {"status": "no match"}


@app.get("/users/{user_id}/swipes")
def get_swipes(user_id: uuid.UUID):
    all_users = get_all_users()
    user = next(user for user in all_users if user.user_id == user_id)
    return {"user_ranked_list": user.user_ranked_list}

