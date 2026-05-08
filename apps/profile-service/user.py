import uuid
from datetime import date


class User:
    def __init__(
        self,
        user_id: uuid.UUID,
        username: str,
        dob: date,
        gender: str,
        preferred_gender: list[str],
        user_ranked_list: list[dict],
        blocked_users: list[uuid.UUID],
        rejected_users: list[uuid.UUID],
        liked_users: list[uuid.UUID],
        matched_users: list[uuid.UUID],
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
        self.user_id = user_id
        self.username = username
        self.dob = dob
        self.gender = gender
        self.preferred_gender = preferred_gender
        self.user_ranked_list = user_ranked_list
        self.blocked_users = blocked_users
        self.rejected_users = rejected_users
        self.liked_users = liked_users
        self.matched_users = matched_users
        self.age_range = age_range
        self.events = events
        self.songs = songs
        self.movies = movies
        self.artists = artists
        self.directors = directors
        self.music_genre = music_genre
        self.movie_genre = movie_genre
        self.shows = shows
        self.art = art
        self.literature = literature

    @property
    def age(self) -> int:
        today = date.today()
        return today.year - self.dob.year - (
            (today.month, today.day) < (self.dob.month, self.dob.day)
        )


# bygger om en User till en dict så vi kan skicka den som JSON till matching-service
def user_to_dict(user: User) -> dict:
    return {
        "user_id": str(user.user_id),
        "username": user.username,
        "dob": user.dob.isoformat(),
        "gender": user.gender,
        "preferred_gender": user.preferred_gender,
        "user_ranked_list": user.user_ranked_list,
        "blocked_users": [str(other) for other in user.blocked_users],
        "rejected_users": [str(other) for other in user.rejected_users],
        "liked_users": [str(other) for other in user.liked_users],
        "matched_users": [str(other) for other in user.matched_users],
        "age_range": list(user.age_range),
        "events": user.events,
        "songs": user.songs,
        "movies": user.movies,
        "artists": user.artists,
        "directors": user.directors,
        "music_genre": user.music_genre,
        "movie_genre": user.movie_genre,
        "shows": user.shows,
        "art": user.art,
        "literature": user.literature,
    }


# bygger en User från JSON som kommer in från ett HTTP-anrop
def user_from_dict(data: dict) -> User:
    return User(
        user_id=uuid.UUID(data["user_id"]),
        username=data["username"],
        dob=date.fromisoformat(data["dob"]),
        gender=data["gender"],
        preferred_gender=data["preferred_gender"],
        user_ranked_list=data["user_ranked_list"],
        blocked_users=[uuid.UUID(other) for other in data["blocked_users"]],
        rejected_users=[uuid.UUID(other) for other in data["rejected_users"]],
        liked_users=[uuid.UUID(other) for other in data["liked_users"]],
        matched_users=[uuid.UUID(other) for other in data["matched_users"]],
        age_range=tuple(data["age_range"]),
        events=data["events"],
        songs=data["songs"],
        movies=data["movies"],
        artists=data["artists"],
        directors=data["directors"],
        music_genre=data["music_genre"],
        movie_genre=data["movie_genre"],
        shows=data["shows"],
        art=data["art"],
        literature=data["literature"],
    )
