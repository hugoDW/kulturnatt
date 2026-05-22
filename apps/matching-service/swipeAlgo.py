# bestämmer vilka personer som visas för användaren, baserat på deras preferenser och tidigare swipes
from user import User

GENDER_TO_PREFERENCE = {
    "woman": "women",
    "man": "men",
    "female": "women",
    "male": "men",
    "non-binary": "non-binary",
}


def gender_is_preferred(profile_gender: str, preferred_genders: list[str]) -> bool:
    if profile_gender in preferred_genders:
        return True
    mapped = GENDER_TO_PREFERENCE.get(profile_gender)
    return mapped in preferred_genders if mapped else False


# skapa en lista med filtrerade användare som används för scoring
def filter_users(current_user: User, all_users: list[User]) -> list[User]:
    user_pool = []
    for user in all_users:
        not_self = (user.user_id != current_user.user_id)
        age_ok = (user.age_range[0] <= current_user.age <= user.age_range[1] and current_user.age_range[0] <= user.age <= current_user.age_range[1])
        gender_ok = (
            gender_is_preferred(user.gender, current_user.preferred_gender)
            and gender_is_preferred(current_user.gender, user.preferred_gender)
        )
        not_blocked = (user.user_id not in current_user.blocked_users and current_user.user_id not in user.blocked_users)
        not_rejected = (user.user_id not in current_user.rejected_users)
        if not_self and age_ok and gender_ok and not_blocked and not_rejected:
            user_pool.append(user)
    return user_pool

# konstanter som används för scoring, kommer ändras...
EVENT_MULTIPLIER = 80
SONG_MOVIE_MULTIPLIER = 10
ARTIST_DIRECTOR_MULTIPLIER = 7
GENRE_MULTIPLIER = 5

# använder de filtrerade användarna från user_pool för att räkna ut score
def scoring_users(current_user: User, user_pool: list[User]) -> list[tuple[User, int]]:
    ranked_user_pool = []
    #räkna hur många av varje typ de har gemensamt
    for user in user_pool:
        shared_events = len(set(current_user.events).intersection(set(user.events)))
        shared_songs = len(set(current_user.songs).intersection(set(user.songs)))
        shared_albums = len(set(current_user.albums).intersection(set(user.albums)))
        shared_movies = len(set(current_user.movies).intersection(set(user.movies)))
        shared_artists = len(set(current_user.artists).intersection(set(user.artists)))
        shared_directors = len(set(current_user.directors).intersection(set(user.directors)))
        shared_music_genre = len(set(current_user.music_genre).intersection(set(user.music_genre)))
        shared_movie_genre = len(set(current_user.movie_genre).intersection(set(user.movie_genre)))
        shared_shows = len(set(current_user.shows).intersection(set(user.shows)))
        shared_literature = len(set(current_user.literature).intersection(set(user.literature)))
        shared_art = int(current_user.art and user.art)

        # uträkning för score
        event_score = shared_events * EVENT_MULTIPLIER
        song_movie_score = (shared_songs + shared_albums + shared_movies + shared_shows) * SONG_MOVIE_MULTIPLIER
        artist_director_score = (shared_artists + shared_directors) * ARTIST_DIRECTOR_MULTIPLIER
        genre_score = (shared_music_genre + shared_movie_genre + shared_literature + shared_art) * GENRE_MULTIPLIER

        user_score = event_score + song_movie_score + artist_director_score + genre_score
        ranked_user_pool.append((user, user_score))
    return sorted(ranked_user_pool, key=lambda x: x[1], reverse=True)

# huvudfunktion som kallar på de två övre, filter och scoring / sortering
def get_scored_users(current_user: User, all_users: list[User]) -> list[tuple[User, int]]:
    user_pool = filter_users(current_user, all_users)
    return scoring_users(current_user, user_pool)

def get_scored_rejected_users(current_user: User, all_users: list[User]) -> list[tuple[User, int]]:
    rejected_pool = [user for user in all_users if user.user_id in current_user.rejected_users]
    return scoring_users(current_user, rejected_pool)
