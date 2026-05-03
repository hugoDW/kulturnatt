import os
import base64
import time
import requests
from dotenv import load_dotenv

load_dotenv()

MUSICBRAINZ_API_KEY = os.getenv("MUSICBRAINZ_API_KEY")

SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")

MUSICBRAINZ_BASE = "https://musicbrainz.org/ws/2"
SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"
SPOTIFY_API_BASE = "https://api.spotify.com/v1"

MUSICBRAINZ_HEADERS = {
    "User-Agent": "KulturMatch (elinflodin999@gmail.com)",
    "Accept": "application/json",
}

if MUSICBRAINZ_API_KEY:
    MUSICBRAINZ_HEADERS["Authorization"] = f"Bearer {MUSICBRAINZ_API_KEY}"


_spotify_token = None
_spotify_token_expires_at = 0


# MusicBrainz HTTP

def _musicbrainz_get(endpoint, params=None):
    try:
        response = requests.get(
            f"{MUSICBRAINZ_BASE}/{endpoint}",
            headers=MUSICBRAINZ_HEADERS,
            params=params,
            timeout=20
        )

        response.raise_for_status()
        return response.json()

    except requests.exceptions.RequestException:
        return None



# Spotify HTTP

def get_spotify_access_token():
    global _spotify_token, _spotify_token_expires_at

    if _spotify_token and time.time() < _spotify_token_expires_at:
        return _spotify_token

    if not SPOTIFY_CLIENT_ID or not SPOTIFY_CLIENT_SECRET:
        raise RuntimeError("Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET in .env")

    auth_string = f"{SPOTIFY_CLIENT_ID}:{SPOTIFY_CLIENT_SECRET}"
    auth_bytes = auth_string.encode("utf-8")
    auth_base64 = base64.b64encode(auth_bytes).decode("utf-8")

    response = requests.post(
        SPOTIFY_TOKEN_URL,
        headers={
            "Authorization": f"Basic {auth_base64}",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        data={
            "grant_type": "client_credentials"
        },
        timeout=10
    )

    response.raise_for_status()
    data = response.json()

    _spotify_token = data["access_token"]
    expires_in = data.get("expires_in", 3600)

    _spotify_token_expires_at = time.time() + expires_in - 60

    return _spotify_token


def _spotify_get(endpoint, params=None):
    token = get_spotify_access_token()

    response = requests.get(
        f"{SPOTIFY_API_BASE}/{endpoint}",
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
        },
        params=params,
        timeout=10
    )

    response.raise_for_status()
    return response.json()


# Hjälpfunktioner

def ms_to_minutes_seconds(ms):
    if not ms:
        return None

    total_seconds = ms // 1000
    minutes = total_seconds // 60
    seconds = total_seconds % 60

    return f"{minutes}:{seconds:02d}"


def extract_year(date_string):
    if not date_string:
        return None

    return str(date_string)[:4]

def get_country_name(country_code):
    if not country_code:
        return None

    try:
        import pycountry

        country = pycountry.countries.get(alpha_2=country_code)

        if country:
            return country.name

    except Exception:
        pass

    return country_code


def extract_genre_from_tags(tags):
    if not tags:
        return None

    genre_names = []

    for tag in tags[:3]:
        name = tag.get("name")
        if name:
            genre_names.append(name.title())

    return ", ".join(genre_names) if genre_names else None


def format_spotify_artists(artists):
    names = []

    for artist in artists or []:
        name = artist.get("name")
        if name:
            names.append(name)

    return ", ".join(names)


def format_spotify_cover(images):
    if not images:
        return None

    largest = images[0]
    smallest = images[-1]

    image_250 = None
    image_500 = None

    for image in images:
        width = image.get("width")

        if width and width >= 250 and image_250 is None:
            image_250 = image.get("url")

        if width and width >= 500 and image_500 is None:
            image_500 = image.get("url")

    return {
        "image_url": largest.get("url"),
        "thumb_250": image_250 or smallest.get("url"),
        "thumb_500": image_500 or largest.get("url"),
        "thumb_1200": largest.get("url"),
    }


# Artistbilder från Spotify

def search_spotify_artists(query, limit=1):
    return _spotify_get("search", {
        "q": query,
        "type": "artist",
        "limit": limit,
        "market": "SE"
    })


def get_spotify_artist_image(artist_name):
    results = search_spotify_artists(artist_name, limit=1)
    artists = results.get("artists", {}).get("items", []) if results else []

    if not artists:
        return None

    images = artists[0].get("images", [])

    if not images:
        return None

    return format_spotify_cover(images)


# Artist från MusicBrainz + bild från Spotify

def search_artists(query, limit=5):
    return _musicbrainz_get("artist", {
        "query": query,
        "fmt": "json",
        "limit": limit
    })


def get_artist(artist_id):
    return _musicbrainz_get(f"artist/{artist_id}", {
        "fmt": "json",
        "inc": "tags"
    })


def format_artist(artist):
    artist_id = artist.get("id")
    artist_name = artist.get("name")

    country = get_country_name(artist.get("country"))
    birth_year = None
    genre = None
    artist_image = None

    if artist_id:
        try:
            full_artist = get_artist(artist_id)

            life_span = full_artist.get("life-span", {})
            birth_year = extract_year(life_span.get("begin"))

            genre = extract_genre_from_tags(full_artist.get("tags", []))
        except requests.exceptions.RequestException:
            birth_year = None
            genre = None

    if artist_name:
        try:
            artist_image = get_spotify_artist_image(artist_name)
        except requests.exceptions.RequestException:
            artist_image = None

    return {
        "name": artist_name,
        "country": country,
        "birth_year": birth_year,
        "genre": genre,
        "type": artist.get("type"),
        "disambiguation": artist.get("disambiguation"),
        "image": artist_image,
    }


def get_artist_suggestions(query, limit=5):
    results = search_artists(query, limit=limit)
    artists = results.get("artists", []) if results else []

    return [format_artist(artist) for artist in artists]


def get_artist_results(query, limit=10):
    results = search_artists(query, limit=limit)
    artists = results.get("artists", []) if results else []

    return [format_artist(artist) for artist in artists]


# Låtar från Spotify + låtomslag

def search_spotify_tracks(query, limit=5):
    return _spotify_get("search", {
        "q": query,
        "type": "track",
        "limit": limit,
        "market": "SE"
    })


def format_spotify_track(track):
    album = track.get("album", {})
    release_date = album.get("release_date")

    return {
        "title": track.get("name"),
        "artists": format_spotify_artists(track.get("artists")),
        "length": ms_to_minutes_seconds(track.get("duration_ms")),
        "year": extract_year(release_date),
        "date": release_date,
        "album": album.get("name"),
        "cover": format_spotify_cover(album.get("images")),
        "spotify_url": track.get("external_urls", {}).get("spotify"),
    }


def get_recording_suggestions(query, limit=5):
    results = search_spotify_tracks(query, limit=limit)
    tracks = results.get("tracks", {}).get("items", []) if results else []

    return [format_spotify_track(track) for track in tracks]


def get_recording_results(query, limit=10):
    results = search_spotify_tracks(query, limit=limit)
    tracks = results.get("tracks", {}).get("items", []) if results else []

    return [format_spotify_track(track) for track in tracks]


# Album från Spotify + albumomslag

def search_spotify_albums(query, limit=5):
    return _spotify_get("search", {
        "q": query,
        "type": "album",
        "limit": limit,
        "market": "SE"
    })


def format_spotify_album(album):
    release_date = album.get("release_date")

    return {
        "title": album.get("name"),
        "artists": format_spotify_artists(album.get("artists")),
        "date": release_date,
        "year": extract_year(release_date),
        "type": album.get("album_type"),
        "total_tracks": album.get("total_tracks"),
        "cover": format_spotify_cover(album.get("images")),
        "spotify_url": album.get("external_urls", {}).get("spotify"),
    }


def get_release_suggestions(query, limit=5):
    results = search_spotify_albums(query, limit=limit)
    albums = results.get("albums", {}).get("items", []) if results else []

    return [format_spotify_album(album) for album in albums]


def get_release_results(query, limit=10):
    results = search_spotify_albums(query, limit=limit)
    albums = results.get("albums", {}).get("items", []) if results else []

    return [format_spotify_album(album) for album in albums]


# Gemensamma sökfunktioner

def get_search_suggestions(query, category, limit=5):
    if category == "artist":
        return get_artist_suggestions(query, limit)

    if category == "recording":
        return get_recording_suggestions(query, limit)

    if category == "release":
        return get_release_suggestions(query, limit)

    return []


def get_search_results(query, category, limit=10):
    if category == "artist":
        return get_artist_results(query, limit)

    if category == "recording":
        return get_recording_results(query, limit)

    if category == "release":
        return get_release_results(query, limit)

    return []


# Profilval

def get_profile_song_data(query, limit=1):
    songs = get_recording_results(query, limit=limit)

    if not songs:
        return None

    song = songs[0]

    return {
        "title": song.get("title"),
        "artists": song.get("artists"),
        "year": song.get("year"),
        "cover": song.get("cover"),
        "spotify_url": song.get("spotify_url"),
    }


def get_profile_album_data(query, limit=1):
    albums = get_release_results(query, limit=limit)

    if not albums:
        return None

    album = albums[0]

    return {
        "title": album.get("title"),
        "artists": album.get("artists"),
        "year": album.get("year"),
        "cover": album.get("cover"),
        "spotify_url": album.get("spotify_url"),
    }


def get_profile_artist_data(query, limit=1):
    artists = get_artist_results(query, limit=limit)

    if not artists:
        return None

    artist = artists[0]

    return {
        "name": artist.get("name"),
        "country": artist.get("country"),
        "birth_year": artist.get("birth_year"),
        "genre": artist.get("genre"),
        "image": artist.get("image"),
    }


# Backend-test

def print_artist_suggestions(query):
    suggestions = get_artist_suggestions(query, limit=5)

    print(f"\nResults for '{query}':\n")

    for i, item in enumerate(suggestions, 1):
        parts = [
            item.get("name"),
            item.get("country"),
            item.get("birth_year"),
            item.get("genre")
        ]

        print(f"{i}. " + " - ".join([p for p in parts if p]))

        if item.get("image") and item["image"].get("thumb_250"):
            print(f"   Image: {item['image']['thumb_250']}")


def print_recording_suggestions(query):
    suggestions = get_recording_suggestions(query, limit=5)

    print(f"\nResults for '{query}':\n")

    for i, item in enumerate(suggestions, 1):
        parts = [
            item.get("title"),
            item.get("artists"),
            item.get("length"),
            item.get("year")
        ]

        print(f"{i}. " + " - ".join([p for p in parts if p]))

        if item.get("cover") and item["cover"].get("thumb_250"):
            print(f"   Cover: {item['cover']['thumb_250']}")


def print_release_suggestions(query):
    suggestions = get_release_suggestions(query, limit=5)

    print(f"\nResults for '{query}':\n")

    for i, item in enumerate(suggestions, 1):
        parts = [
            item.get("title"),
            item.get("artists"),
            item.get("year")
        ]

        print(f"{i}. " + " - ".join([p for p in parts if p]))

        if item.get("cover") and item["cover"].get("thumb_250"):
            print(f"   Cover: {item['cover']['thumb_250']}")


if __name__ == "__main__":
    try:
        print("Choose category")
        print("1. Artist")
        print("2. Song")
        print("3. Album")

        choice = input("\nChoose: ").strip()
        query = input("Type your search: ").strip()

        if choice == "1":
            print_artist_suggestions(query)
        elif choice == "2":
            print_recording_suggestions(query)
        elif choice == "3":
            print_release_suggestions(query)
        else:
            print("Invalid choice.")

    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")