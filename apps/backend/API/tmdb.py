import requests
import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv('TMDB_API_KEY')
BASE_URL = "https://api.themoviedb.org/3"

########### SÖKNING EFTER DATA ###########

def search_movie(query):
    url = f"{BASE_URL}/search/movie"
    params = {
        "api_key": API_KEY,
        "query": query
    }

    response = requests.get(url, params=params)
    data = response.json()

    results = []

    for movie in data.get("results", []):
        results.append({
            "id": movie.get("id"),
            "title": movie.get("title"),
            "year": movie.get("release_date", "")[:4],
            "director": get_director(movie.get("id")),
            "poster_path": build_poster_url(movie.get("poster_path"))
        })
    
    return results

def search_tv_show(query):
    url = f"{BASE_URL}/search/tv"
    params = {
        "api_key": API_KEY,
        "query": query
    }

    response = requests.get(url, params=params)
    data = response.json()

    results = []

    for show in data.get("results", []):
        results.append({
            "id": show.get("id"),
            "name": show.get("name"),
            "first aired": show.get("first_air_date"),
            "poster_path": build_poster_url(show.get("poster_path"))
        })
    
    return results

def search_actor(query):
    url = f"{BASE_URL}/search/person"
    params = {
        "api_key": API_KEY,
        "query": query
    }

    response = requests.get(url, params=params)
    data = response.json()

    results = []

    for person in data.get("results", []):
        if person.get("known_for_department") == "Acting":
            results.append({
                "id": person.get("id"),
                "name": person.get("name"),
                "date_of_birth": person.get("birthday"),
                "profile_path": build_profile_url(person.get("profile_path"))
            })
    
    return results

def search_director(query):
    url = f"{BASE_URL}/search/person"
    params = {
        "api_key": API_KEY,
        "query": query
    }

    response = requests.get(url, params=params)
    data = response.json()

    results = []

    for person in data.get("results", []):
        if person.get("known_for_department") == "Directing":
            results.append({
                "id": person.get("id"),
                "name": person.get("name"),
                "date_of_birth": person.get("birthday"),
                "profile_path": build_profile_url(person.get("profile_path"))
            })
    
    return results

########### HÄMTNING AV DATA ###########

def get_movie(movie_id):
    url = f"{BASE_URL}/movie/{movie_id}"
    params = {
        "api_key": API_KEY,
    }

    response = requests.get(url, params=params)
    data = response.json()

    return {
        "id": data["id"],                           ## Filmens unika ID på TMDB
        "title": data["title"],                     ## Filmens titel
        "release_date": data["release_date"],       ## Datumet då filmen hade premiär
        "poster_path": data["poster_path"]          ## URL till filmens affisch
    }

def get_director(movie_id):
    url = f"{BASE_URL}/movie/{movie_id}/credits"    ## Regissör lagras ej direkt under filmen, utan under medverkande
    params = {
        "api_key": API_KEY,
    }

    response = requests.get(url, params=params)
    data = response.json()

    for person in data["crew"]:
        if person["job"] == "Director":
            return person["name"]
    
    return None

def build_poster_url(path):                         ## Sätter ihop en fungerande länk för åtkomst till postern
    if path:
        return f"https://image.tmdb.org/t/p/w500{path}"
    return None

def get_tv_show(show_id):
    url = f"{BASE_URL}/tv/{show_id}"
    params = { "api_key": API_KEY }

    response = requests.get(url, params=params)
    data = response.json()

    return {
        "id": data["id"],                           ## Seriens unika ID på TMDB
        "name": data["name"],                       ## Seriens namn
        "first aired": data["first_air_date"],      ## Datumet då serien sändes för första gången
        "poster_path": data["poster_path"]          ## URL till relevant affisch för serien
    }

def get_person(person_id):
    url = f"{BASE_URL}/person/{person_id}"
    params = {
        "api_key": API_KEY,
    }

    response = requests.get(url, params=params)
    data = response.json()

    return{
        "id": data["id"],
        "name": data["name"],
        "date_of_birth": data["birthday"],
        "profile_path": data["profile_path"]
    }


def build_profile_url(path):                                    ## Sätter ihop en fungerande länk för åtkomst till bild
    if path:
        return f"https://image.tmdb.org/t/p/w300_and_h450_face{path}"
    return None

##movie = get_movie(24128)                                        ## Hämtar relevanta värden om en film baserat på angivet ID, i detta fall Stop Making Sense
##movie["director"] = get_director(24128)                         ## Hämtar namnet på regissör av film baserat på angivet ID, i detta fall Jonathan Demme
##movie["poster_url"] = build_poster_url(movie["poster_path"])    ## Bygger ihop en korrekt url för visning av primär affisch

##show = get_tv_show(30991)                                       ## Hämtar relevant data om en serie baserat på angivet ID, i detta fall Cowboy Bebop
##show["poster_url"] = build_poster_url(show["poster_path"])      ## Bygger ihop en korrekt url för visning av primär affisch

##actor = get_person(5602)                                        ## Hämtar relevant data om en person baserat på angivet ID, i detta fall David Lynch
##actor["profile_path"] = build_profile_url(actor["profile_path"])