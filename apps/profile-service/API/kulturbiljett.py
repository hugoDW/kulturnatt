import re
import requests
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

HEADERS = {"Authorization": f"Token {os.getenv('KULTURBILJETT_API_KEY')}"}
BASE = "https://kulturbiljetter.se/api/v3/events"

def get_events():
    response = requests.get(f"{BASE}/", headers=HEADERS, timeout=10)
    response.raise_for_status()
    return response.json()

def get_event(event_id):
    response = requests.get(f"{BASE}/{event_id}", headers=HEADERS, timeout=10)
    response.raise_for_status()
    return response.json()

def strip_html(s):
    return re.sub(r"<[^>]+>", "", s or "").strip()

def fmt_time(ts):
    return datetime.fromtimestamp(ts).strftime("%Y-%m-%d %H:%M")

if __name__ == "__main__":
    events = list(get_events().values())
    print(f"Found {len(events)} events\n")
    for i, item in enumerate(events, 1):
        e = get_event(item["event_id"])
        print(f"=== {i}. {e['title']} ===")
        print(f"Organizer: {e['organizer']['name']}")
        print(f"Price:     {e['price_min']}–{e['price_max']} kr")
        print(f"\nDescription:\n  {strip_html(e['presentation_short'])}")
        print("\nLocations:")
        for loc in e["locations"].values():
            print(f"  - {loc['name']}, {loc['street']}, {loc['city']}")
        print("\nDates:")
        for d in e["dates"].values():
            loc = e["locations"].get(str(d["location_id"]), {})
            print(f"  - {fmt_time(d['unixtime_start'])} @ {loc.get('name', '?')} ({d['ticket_available']} tickets left)")
        print("\n" + "-" * 60 + "\n")
        
