import requests
import os
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv('TICKETMASTER_API_KEY')
BASE_URL = "https://app.ticketmaster.com/discovery/v2/events.json"


################ SÖK EFTER EVENEMANG ####################


def get_events():
    params = {
        "apikey": API_KEY,
        "latlong": "59.3293,18.0686",
        "radius": 25,
        "unit": "km"
    }

    response = requests.get( BASE_URL, params=params )

    if response.status_code != 200:
        print( "Error:", response.status_code, response.text )
        return []

    data = response.json()

    events = []

    for event in data.get("_embedded", {}).get("events", []):
        events.append({
            "name": event.get("name"),
            "date": event.get("dates", {}).get("start", {}).get("localDate"),
            "venue": event.get("_embedded", {}).get("venues", [{}])[0].get("name"),
            "image_url": get_event_image(event)
        })
    
    return events

def get_event_image(event):
    images = event.get("images", [])

    for img in images:
        if img.get("ratio") == "16_9":
            return img.get("url")
    
    return images[0]["url"] if images else None

events = get_events()

for e in events[:10]:
    print(e)