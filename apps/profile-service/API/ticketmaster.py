import requests
import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv('TICKETMASTER_API_KEY')
BASE_URL = "https://app.ticketmaster.com/discovery/v2/events.json"


################ SÖK EFTER EVENEMANG ####################


def get_events(city=None, query=None):
    params = {
        "apikey": API_KEY,
        "countryCode": "SE",
        "sort": "date,asc",
    }

    if city:
        params["city"] = city

    if query:
        params["keyword"] = query

    response = requests.get(BASE_URL, params=params, timeout=10)
    response.raise_for_status()

    data = response.json()

    events = []

    for event in data.get("_embedded", {}).get("events", []):
        start = event.get("dates", {}).get("start", {})
        local_date = start.get("localDate")
        local_time = start.get("localTime")
        date = f"{local_date} {local_time[:5]}" if local_date and local_time else local_date

        events.append({
            "id": event.get("id"),
            "name": event.get("name"),
            "date": date,
            "venue": event.get("_embedded", {}).get("venues", [{}])[0].get("name"),
            "city": event.get("_embedded", {}).get("venues", [{}])[0].get("city", {}).get("name"),
            "image_url": get_event_image(event)
        })

    return events

def get_event_image(event):
    images = event.get("images", [])

    for img in images:
        if img.get("ratio") == "16_9":
            return img.get("url")
    
    return images[0]["url"] if images else None

if __name__ == "__main__":
    events = get_events()

    for e in events[:10]:
        print(e)
