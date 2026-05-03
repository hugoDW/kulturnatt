import uuid

class User:
    def __init__(
        self,
        user_id: uuid.UUID,
        username: str,
        age: int,
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
        self.age = age
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
