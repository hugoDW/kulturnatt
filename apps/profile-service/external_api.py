from typing import Any

import requests

from API import kulturbiljett
from API import musicbrainz
from API import ticketmaster
from API import tmdb


class ExternalApiError(Exception):
    def __init__(self, message: str, status_code: int = 502):
        super().__init__(message)
        self.status_code = status_code


def _call_external(fn, *args: Any, **kwargs: Any) -> Any:
    try:
        return fn(*args, **kwargs)
    except RuntimeError as exc:
        raise ExternalApiError(str(exc), 500) from exc
    except requests.RequestException as exc:
        raise ExternalApiError("External API request failed") from exc
    except ValueError as exc:
        raise ExternalApiError("External API returned invalid data") from exc


def list_kulturbiljett_events(
    query: str | None = None,
    city: str | None = None,
) -> list[dict[str, Any]]:
    data = _call_external(kulturbiljett.get_events)
    events = data.values() if isinstance(data, dict) else data
    return [
        _format_kulturbiljett_event_summary(event)
        for event in events or []
        if _matches_event_filters(event, query, city)
    ]


def get_kulturbiljett_event(event_id: str) -> dict[str, Any]:
    event = _call_external(kulturbiljett.get_event, event_id)
    return _format_kulturbiljett_event(event)


def list_ticketmaster_events(
    query: str | None = None,
    city: str | None = None,
) -> list[dict[str, Any]]:
    events = _call_external(ticketmaster.get_events, city, query)
    return [_format_ticketmaster_event(event) for event in events or []]


def _matches_event_filters(
    event: dict[str, Any],
    query: str | None,
    city: str | None,
) -> bool:
    if city and city.lower() not in _event_cities(event):
        return False

    if not query:
        return True

    searchable_values = [
        event.get("title"),
        event.get("presentation_short"),
        *(location.get("name") for location in _event_locations(event)),
        *(location.get("city") for location in _event_locations(event)),
    ]

    organizer = event.get("organizer")
    if isinstance(organizer, dict):
        searchable_values.append(organizer.get("name"))

    searchable_text = " ".join(str(value) for value in searchable_values if value)
    return query.lower() in searchable_text.lower()


def _event_locations(event: dict[str, Any]) -> list[dict[str, Any]]:
    locations = event.get("locations")
    if isinstance(locations, dict):
        return list(locations.values())
    if isinstance(locations, list):
        return locations
    return []


def _event_cities(event: dict[str, Any]) -> set[str]:
    return {
        str(location.get("city")).lower()
        for location in _event_locations(event)
        if location.get("city")
    }


def _format_kulturbiljett_event_summary(event: dict[str, Any]) -> dict[str, Any]:
    organizer = event.get("organizer")
    locations = _event_locations(event)
    cities = sorted({location.get("city") for location in locations if location.get("city")})
    return {
        "id": event.get("event_id"),
        "title": event.get("title"),
        "source": "Kulturbiljett",
        "organizer": organizer.get("name") if isinstance(organizer, dict) else None,
        "city": cities[0] if cities else None,
        "venue": locations[0].get("name") if locations else None,
        "date": None,
        "image_url": None,
    }


def _format_kulturbiljett_event(event: dict[str, Any]) -> dict[str, Any]:
    locations = event.get("locations", {})
    dates = event.get("dates", {})
    return {
        **_format_kulturbiljett_event_summary(event),
        "description": kulturbiljett.strip_html(event.get("presentation_short")),
        "locations": [
            {
                "id": location.get("location_id"),
                "name": location.get("name"),
                "street": location.get("street"),
                "city": location.get("city"),
            }
            for location in locations.values()
        ],
        "dates": [
            {
                "id": date.get("date_id"),
                "start": kulturbiljett.fmt_time(date.get("unixtime_start"))
                if date.get("unixtime_start")
                else None,
                "ticket_available": date.get("ticket_available"),
                "location_id": date.get("location_id"),
                "location_name": locations.get(str(date.get("location_id")), {}).get("name"),
            }
            for date in dates.values()
        ],
    }


def _format_ticketmaster_event(event: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": event.get("id"),
        "title": event.get("name"),
        "source": "Ticketmaster",
        "name": event.get("name"),
        "date": event.get("date"),
        "venue": event.get("venue"),
        "city": event.get("city"),
        "image_url": event.get("image_url"),
    }


def search_artist(query: str, limit: int) -> list[dict[str, Any]]:
    return _call_external(musicbrainz.get_artist_results, query, limit)


def search_song(query: str, limit: int) -> list[dict[str, Any]]:
    return _call_external(musicbrainz.get_recording_results, query, limit)


def search_album(query: str, limit: int) -> list[dict[str, Any]]:
    return _call_external(musicbrainz.get_release_results, query, limit)


def search_music(query: str, category: str, limit: int) -> list[dict[str, Any]]:
    if category == "artist":
        return search_artist(query, limit)
    if category == "recording":
        return search_song(query, limit)
    if category == "release":
        return search_album(query, limit)
    raise ExternalApiError("Unsupported music category", 400)


def search_tmdb(query: str, category: str) -> list[dict[str, Any]]:
    if category == "movie":
        return _call_external(tmdb.search_movie, query)
    if category == "tv":
        return _call_external(tmdb.search_tv_show, query)
    if category == "actor":
        return _call_external(tmdb.search_actor, query)
    if category == "director":
        return _call_external(tmdb.search_director, query)
    raise ExternalApiError("Unsupported TMDB category", 400)


def get_tmdb_movie(movie_id: int) -> dict[str, Any]:
    movie = _call_external(tmdb.get_movie, movie_id)
    return {
        **movie,
        "poster_url": tmdb.build_poster_url(movie.get("poster_path")),
    }


def get_tmdb_tv(show_id: int) -> dict[str, Any]:
    show = _call_external(tmdb.get_tv_show, show_id)
    return {
        **show,
        "poster_url": tmdb.build_poster_url(show.get("poster_path")),
    }


def get_tmdb_person(person_id: int) -> dict[str, Any]:
    person = _call_external(tmdb.get_person, person_id)
    return {
        **person,
        "profile_url": tmdb.build_profile_url(person.get("profile_path")),
    }
