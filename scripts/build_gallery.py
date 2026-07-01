#!/usr/bin/env python3
"""Build data/gallery.json for the /gallery/ page.

Enumerates the curated CDN renderings (wiki / timeline / library / earth),
pairs each with its thumbnail + webp variants, pulls alt/caption from the
frontmatter that references it, and maps each image to the page(s) that use
it by scanning the English content tree for the filename.

Zola can't list the CDN folder at build time, so this is run manually (or in
CI) and the resulting data/gallery.json is committed — same pattern as
data/sources.json. The images themselves live in the sibling
assets.wheelofheaven.world repo; only the JSON is committed here.

Usage:  python scripts/build_gallery.py   (from the www repo root)
"""
import json
import re
import sys
from pathlib import Path

WWW = Path(__file__).resolve().parent.parent
ASSETS = WWW.parent / "assets.wheelofheaven.world" / "images"
CONTENT = WWW / "content"
CDN = "https://assets.wheelofheaven.world/images"
OUT = WWW / "data" / "gallery.json"

# Categories to include, in display order, with human labels.
CATEGORIES = [
    ("timeline", "Timeline"),
    ("wiki", "Wiki"),
    ("cinematic", "Cinematic"),
    ("library", "Library"),
    ("earth", "Earth"),
]

# Cinematic audiobook scene art is nested per-book (cinematic/<book>/<scene>.jpg)
# rather than flat, and is referenced by the player's scene manifest rather than
# by filename in content — so each book's renders map to that book's library
# page. Handled separately from the flat avif categories below.
CINEMATIC_BOOKS = {
    "the-book-which-tells-the-truth": (
        "The Book Which Tells the Truth",
        "/library/the-book-which-tells-the-truth/",
    ),
    "extraterrestrials-took-me-to-their-planet": (
        "Extraterrestrials Took Me to Their Planet",
        "/library/extraterrestrials-took-me-to-their-planet/",
    ),
}

LANG_DIRS = {"de", "es", "fr", "ru", "ja", "ko", "zh", "zh-Hant", "he"}

# Renders to keep out of the gallery even when they're referenced on a page.
# The author portrait, for instance, belongs on the author page — not the wall.
EXCLUDE_NAMES = {
    "fact-check",
    "abundance",
    "bird-of-paradise",
    "saurian-experiments",
    "zara_san",
}

# Whole categories to keep out of the gallery.
EXCLUDE_CATEGORIES = {"library"}


def is_english(md: Path) -> bool:
    """content/wiki/x.md is English; content/de/wiki/x.md is not."""
    rel = md.relative_to(CONTENT).parts
    return not (rel and rel[0] in LANG_DIRS)


def page_url(md: Path) -> str:
    rel = md.relative_to(CONTENT).with_suffix("")
    parts = [p for p in rel.parts if p != "_index"]
    return "/" + ("/".join(parts) + "/" if parts else "")


def frontmatter(text: str) -> str:
    m = re.match(r"\s*\+\+\+(.*?)\+\+\+", text, re.S)
    return m.group(1) if m else ""


def fm_value(fm: str, key: str):
    m = re.search(rf'^{re.escape(key)}\s*=\s*"((?:[^"\\]|\\.)*)"', fm, re.M)
    return m.group(1) if m else None


def main() -> int:
    if not ASSETS.exists():
        print(f"ERROR: assets images dir not found at {ASSETS}", file=sys.stderr)
        print("Clone the assets.wheelofheaven.world repo as a sibling of this one.", file=sys.stderr)
        return 1

    # Read every English content file once: (url, title, fulltext, fm).
    pages = []
    for md in CONTENT.rglob("*.md"):
        if not is_english(md):
            continue
        try:
            text = md.read_text(encoding="utf-8")
        except Exception:
            continue
        fm = frontmatter(text)
        title = fm_value(fm, "title")
        if title is None:
            continue  # index/section pages without a title — skip as targets
        pages.append({"url": page_url(md), "title": title, "text": text, "fm": fm})

    images = []
    for cat, _label in CATEGORIES:
        if cat in EXCLUDE_CATEGORIES:
            continue
        d = ASSETS / cat
        if not d.is_dir():
            continue
        fulls = sorted(p for p in d.glob("*.avif") if not p.stem.endswith("_thumb"))
        for p in fulls:
            name = p.stem
            if name in EXCLUDE_NAMES:
                continue
            base = f"{CDN}/{cat}/{name}"
            thumb_avif = d / f"{name}_thumb.avif"
            thumb = f"{base}_thumb" if thumb_avif.exists() else base

            # Where used + alt/caption from a page that references this image.
            used_on, alt, caption = [], None, None
            for pg in pages:
                if name in pg["text"]:
                    used_on.append({"title": pg["title"], "url": pg["url"]})
                    if alt is None and name in pg["fm"]:
                        alt = fm_value(pg["fm"], "image_alt")
                        caption = fm_value(pg["fm"], "image_caption")

            # Gallery shows only renders that are actually used on a page.
            if not used_on:
                continue

            images.append({
                "category": cat,
                "name": name,
                "full": f"{base}.avif",
                "full_webp": f"{base}.webp",
                "full_src": f"{base}.webp",
                "thumb": f"{thumb}.avif",
                "thumb_webp": f"{thumb}.webp",
                "alt": alt or "",
                "caption": caption or "",
                "used_on": used_on,
            })

    # Cinematic scene art — jpg fulls with generated _thumb.avif/.webp tiles.
    # No avif/webp full variants, so the lightbox falls back to full_src (jpg).
    cine_dir = ASSETS / "cinematic"
    if cine_dir.is_dir():
        for slug, (book_title, book_url) in CINEMATIC_BOOKS.items():
            bdir = cine_dir / slug
            if not bdir.is_dir():
                continue
            for p in sorted(bdir.glob("*.jpg")):
                name = p.stem
                if name.startswith("thumb-") or name.endswith("_thumb"):
                    continue  # player chapter thumbs / generated thumbs
                base = f"{CDN}/cinematic/{slug}/{name}"
                label = name.replace("-", " ").capitalize()
                images.append({
                    "category": "cinematic",
                    "name": name,
                    "full": "",
                    "full_webp": "",
                    "full_src": f"{base}.jpg",
                    "thumb": f"{base}_thumb.avif",
                    "thumb_webp": f"{base}_thumb.webp",
                    "alt": label,
                    "caption": label,
                    "used_on": [{"title": book_title, "url": book_url}],
                })

    cat_counts = {}
    for im in images:
        cat_counts[im["category"]] = cat_counts.get(im["category"], 0) + 1

    data = {
        "categories": [
            {"key": k, "label": label, "count": cat_counts.get(k, 0)}
            for k, label in CATEGORIES if cat_counts.get(k, 0)
        ],
        "total": len(images),
        "images": images,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    used = sum(1 for im in images if im["used_on"])
    print(f"Wrote {OUT.relative_to(WWW)}: {len(images)} images "
          f"({used} used, {len(images) - used} unreferenced) across "
          f"{len(data['categories'])} categories.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
