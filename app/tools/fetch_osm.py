"""Refreshes the OpenStreetMap extracts in tools/osm/ from Overpass.

Run: python tools/fetch_osm.py   (then python tools/build_routes.py)
"""
import json
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from build_routes import ROUTES  # noqa: E402  the route list lives in one place

OUT = Path(__file__).parent / "osm"
MIRRORS = ["https://overpass-api.de/api/interpreter", "https://overpass.private.coffee/api/interpreter"]
UA = "dadaan-ba-build/0.2 (+https://github.com/J3nrick/dadaan-ba)"
AREA = "14.20,120.84,14.60,121.06"  # Imus/Bacoor plus the far ends commuters ride to (PITX, Alabang, Makati edge)

LOCAL = "14.33,120.90,14.47,121.00"  # Imus + Bacoor
ids = ",".join(str(i) for r in ROUTES for i in r["osm"][:1])
QUERIES = {
    "geom.json": f"[out:json][timeout:180];rel(id:{ids});out geom;",
    # Named stop/platform nodes of those routes: where people actually wait.
    "stops.json": f"[out:json][timeout:120];rel(id:{ids});node(r)[name];out;",
    "poi.json": (
        "[out:json][timeout:180];("
        f'nwr["shop"="mall"]({AREA});'
        f'nwr["amenity"~"townhall|bus_station|university|college|hospital"]["name"]({AREA});'
        f'nwr["public_transport"="station"]["name"]({AREA});'
        'nwr["amenity"="place_of_worship"]["name"~"Cathedral|Parish"](14.38,120.92,14.46,120.96);'
        ");out center tags;"
    ),
    # Every terminal and tricycle/pedicab stand inside Imus and Bacoor, for "nearest to you".
    "local.json": (
        f"[out:json][timeout:120];("
        f'nwr["amenity"~"^(taxi|tricycle_terminal|bus_station|fx_station)$"]({LOCAL});'
        f'nwr["name"~"Tricycle|TODA|Pedicab",i]({LOCAL});'
        ");out center tags;"
    ),
}


def fetch(q):
    body = urllib.parse.urlencode({"data": q}).encode()
    for attempt in range(6):
        url = MIRRORS[attempt % len(MIRRORS)]
        try:
            req = urllib.request.Request(url, body, {"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=240) as r:
                return json.loads(r.read())
        except Exception as e:  # Overpass is often busy (429/502/504); back off and try the next mirror
            print(f"  {url}: {e}; retrying")
            time.sleep(5 * (attempt + 1))
    raise SystemExit("Overpass unavailable, try again later")


if __name__ == "__main__":
    for name, q in QUERIES.items():
        data = fetch(q)
        (OUT / name).write_text(json.dumps(data, ensure_ascii=False), "utf-8")
        print(f"{name}: {len(data['elements'])} elements")
