from user import User

def get_shared_interests(user_a: User, user_b: User) -> dict:
    return {
        "events":      list(set(user_a.events)      & set(user_b.events)),
        "songs":       list(set(user_a.songs)       & set(user_b.songs)),
        "movies":      list(set(user_a.movies)      & set(user_b.movies)),
        "artists":     list(set(user_a.artists)     & set(user_b.artists)),
        "directors":   list(set(user_a.directors)   & set(user_b.directors)),
        "music_genre": list(set(user_a.music_genre) & set(user_b.music_genre)),
        "movie_genre": list(set(user_a.movie_genre) & set(user_b.movie_genre)),
    }

def is_mutual_like(user_a: User, user_b: User) -> bool:
    return user_b.user_id in user_a.liked_users and user_a.user_id in user_b.liked_users

def create_match(user_a: User, user_b: User) -> dict | None:
    if not is_mutual_like(user_a, user_b):
        return None
    return {
        "users": (user_a, user_b),
        "shared": get_shared_interests(user_a, user_b),
    }
