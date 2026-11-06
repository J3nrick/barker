"""Refreshes the OpenStreetMap extracts in tools/osm/ from Overpass.

Run: python tools/fetch_osm.py          Cavite   (then python tools/build_routes.py)
     python tools/fetch_osm.py manila   Metro Manila (then python tools/build_manila.py)
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
MIRRORS = ["https://overpass-api.de/api/interpreter", "https://overpass.private.coffee/api/interpreter", "https://maps.mail.ru/osm/tools/overpass/api/interpreter"]
UA = "barker-build/0.3 (+https://github.com/J3nrick/barker)"
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
    for attempt in range(10):
        url = MIRRORS[attempt % len(MIRRORS)]
        try:
            req = urllib.request.Request(url, body, {"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=240) as r:
                return json.loads(r.read())
        except Exception as e:  # Overpass is often busy (429/502/504); back off and try the next mirror
            print(f"  {url}: {e}; retrying")
            time.sleep(min(5 * (attempt + 1), 30))
    raise SystemExit("Overpass unavailable, try again later")


def fetch_manila():
    """Metro Manila: list every route, keep the ones build_manila.pick() wants, then fetch those in batches."""
    from build_manila import BBOX, pick

    out = OUT / "manila"
    out.mkdir(exist_ok=True)
    box = ",".join(map(str, BBOX))
    parts = out / "parts"  # each batch is saved, so a rerun after Overpass gives up picks up where it stopped
    parts.mkdir(exist_ok=True)

    def cached(name, q):
        f = parts / name
        try:
            return json.loads(f.read_text("utf-8"))
        except (OSError, ValueError):  # not fetched yet, or cut off mid-write
            data = fetch(q)
            f.write_text(json.dumps(data, ensure_ascii=False), "utf-8")
            return data

    listing = cached("listing.json", f'[out:json][timeout:180];rel["type"="route"]["route"~"^(bus|share_taxi|minibus|light_rail|subway|train|monorail)$"]({box});out body;')
    ids = sorted(e["id"] for e, _, _ in pick(listing["elements"]))
    print(f"{len(ids)} of {len(listing['elements'])} routes picked", flush=True)
    geom, stops, size = [], [], 15  # Overpass times out on big "out geom" requests
    for i in range(0, len(ids), size):
        batch = ",".join(map(str, ids[i:i + size]))
        if (parts / f"geom-{i}.json").exists():  # batches saved by an earlier run
            geom += cached(f"geom-{i}.json", "")["elements"]
            stops += cached(f"stops-{i}.json", f"[out:json][timeout:180];rel(id:{batch});node(r)[name];out;")["elements"]
        else:  # one request for both halves the round trips to a busy server
            both = cached(f"batch-{i}.json", f"[out:json][timeout:180];rel(id:{batch});out geom;node(r)[name];out;")["elements"]
            geom += [e for e in both if e["type"] == "relation"]
            stops += [e for e in both if e["type"] == "node"]
        print(f"  {min(i + size, len(ids))}/{len(ids)}", flush=True)
    queries = {
        "poi.json": f'[out:json][timeout:180];(nwr["shop"="mall"]["name"]({box});nwr["amenity"~"^(university|college|hospital|townhall|bus_station)$"]["name"]({box});nwr["railway"="station"]["name"]({box}););out center tags;',
        "local.json": f'[out:json][timeout:180];(nwr["railway"="station"]["name"]({box});nwr["amenity"~"^(taxi|tricycle_terminal|bus_station|fx_station)$"]({box});nwr["name"~"Tricycle|TODA|Pedicab",i]({box}););out center tags;',
    }
    files = {"geom.json": {"elements": geom}, "stops.json": {"elements": list({e["id"]: e for e in stops}.values())}}
    files.update({name: cached(name, q) for name, q in queries.items()})
    for name, data in files.items():
        (out / name).write_text(json.dumps(data, ensure_ascii=False), "utf-8")
        print(f"manila/{name}: {len(data['elements'])} elements")


if __name__ == "__main__" and sys.argv[1:] == ["manila"]:
    fetch_manila()
elif __name__ == "__main__":
    for name, q in QUERIES.items():
        data = fetch(q)
        (OUT / name).write_text(json.dumps(data, ensure_ascii=False), "utf-8")
        print(f"{name}: {len(data['elements'])} elements")
