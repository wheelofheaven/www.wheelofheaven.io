#!/usr/bin/env python3
"""Build the zodiac sky dataset for /timeline/chronology/.

Derives a compact ecliptic-band star map from the d3-celestial data files
(https://github.com/ofrohn/d3-celestial, BSD-3; star data ultimately from
the Yale Bright Star Catalogue / HYG, public domain):

  - stars.6.json               all stars to magnitude 6 (equatorial J2000)
  - constellations.lines.json  constellation stick figures (equatorial J2000)

Both are converted to ecliptic coordinates (J2000 obliquity) and filtered
to the zodiac band, then written to static/data/zodiac-sky.json which the
chronology page's canvas renderer fetches at runtime.

Output format:
  {
    "meta":  { ... provenance ... },
    "stars": [[lon, lat, mag, bv], ...],          # ecliptic degrees
    "zodiac": [
      { "id": "cap", "name": "Capricornus", "center": 303.9,
        "lines": [[[lon, lat], ...], ...] },
      ...
    ]
  }

Usage:
  python scripts/build_zodiac_sky.py            # fetch from GitHub
  python scripts/build_zodiac_sky.py --cache DIR  # use pre-downloaded files
"""

from __future__ import annotations

import argparse
import json
import math
import urllib.request
from pathlib import Path

RAW_BASE = "https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data"
STARS_FILE = "stars.6.json"
LINES_FILE = "constellations.lines.json"

OBLIQUITY = math.radians(23.4392911)  # J2000 mean obliquity

# The 12 zodiac constellations, in ecliptic (retrograde-precession) order
# starting from Aries. IAU 3-letter ids as used by d3-celestial.
ZODIAC = {
    "Ari": "Aries",
    "Tau": "Taurus",
    "Gem": "Gemini",
    "Cnc": "Cancer",
    "Leo": "Leo",
    "Vir": "Virgo",
    "Lib": "Libra",
    "Sco": "Scorpius",
    "Sgr": "Sagittarius",
    "Cap": "Capricornus",
    "Aqr": "Aquarius",
    "Psc": "Pisces",
}

BAND_LAT = 35.0    # keep stars within +/- this ecliptic latitude
MAG_LIMIT = 6.0    # background-star magnitude cutoff

REPO_ROOT = Path(__file__).resolve().parent.parent
OUT_PATH = REPO_ROOT / "static" / "data" / "zodiac-sky.json"


def eq_to_ecliptic(ra_deg: float, dec_deg: float) -> tuple[float, float]:
    """Equatorial J2000 (degrees) -> ecliptic longitude/latitude (degrees)."""
    ra = math.radians(ra_deg)
    dec = math.radians(dec_deg)
    sin_e, cos_e = math.sin(OBLIQUITY), math.cos(OBLIQUITY)
    lon = math.atan2(
        math.sin(ra) * cos_e + math.tan(dec) * sin_e,
        math.cos(ra),
    )
    lat = math.asin(
        math.sin(dec) * cos_e - math.cos(dec) * sin_e * math.sin(ra)
    )
    return math.degrees(lon) % 360.0, math.degrees(lat)


def load(name: str, cache: Path | None) -> dict:
    if cache:
        return json.loads((cache / name).read_text())
    with urllib.request.urlopen(f"{RAW_BASE}/{name}", timeout=30) as resp:
        return json.loads(resp.read())


def circular_mean(lons: list[float]) -> float:
    x = sum(math.cos(math.radians(l)) for l in lons)
    y = sum(math.sin(math.radians(l)) for l in lons)
    return math.degrees(math.atan2(y, x)) % 360.0


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cache", type=Path, default=None,
                        help="directory holding pre-downloaded data files")
    args = parser.parse_args()

    stars_geo = load(STARS_FILE, args.cache)
    lines_geo = load(LINES_FILE, args.cache)

    stars = []
    for feat in stars_geo["features"]:
        ra, dec = feat["geometry"]["coordinates"]
        mag = float(feat["properties"]["mag"])
        if mag > MAG_LIMIT:
            continue
        lon, lat = eq_to_ecliptic(ra, dec)
        if abs(lat) > BAND_LAT:
            continue
        try:
            bv = round(float(feat["properties"].get("bv") or 0.0), 2)
        except ValueError:
            bv = 0.0
        stars.append([round(lon, 2), round(lat, 2), round(mag, 2), bv])
    stars.sort(key=lambda s: s[2])  # brightest first so partial draws degrade well

    zodiac = []
    for cid, name in ZODIAC.items():
        feat = next(f for f in lines_geo["features"] if f["id"] == cid)
        lines = []
        lons = []
        for seg in feat["geometry"]["coordinates"]:
            pts = []
            for ra, dec in seg:
                lon, lat = eq_to_ecliptic(ra, dec)
                pts.append([round(lon, 2), round(lat, 2)])
                lons.append(lon)
            lines.append(pts)
        zodiac.append({
            "id": cid.lower(),
            "name": name,
            "center": round(circular_mean(lons), 2),
            "lines": lines,
        })

    out = {
        "meta": {
            "source": "d3-celestial data (BSD-3, ofrohn/d3-celestial); "
                      "stars from the Yale Bright Star Catalogue via HYG",
            "coords": "ecliptic J2000 degrees [lon, lat]",
            "star_fields": ["lon", "lat", "mag", "bv"],
            "band_lat": BAND_LAT,
            "mag_limit": MAG_LIMIT,
        },
        "stars": stars,
        "zodiac": zodiac,
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(out, separators=(",", ":")) + "\n")
    size_kb = OUT_PATH.stat().st_size / 1024
    print(f"wrote {OUT_PATH} ({size_kb:.0f} KB, {len(stars)} stars, "
          f"{len(zodiac)} constellations)")


if __name__ == "__main__":
    main()
