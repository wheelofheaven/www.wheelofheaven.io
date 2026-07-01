#!/usr/bin/env python3
"""Generate gallery thumbnails for the cinematic audiobook scene art.

The cinematic renders live in the sibling assets repo as full-size JPEGs
(`images/cinematic/<book>/<scene>.jpg`, ~1080p, ~500 KB each) with no
smaller variants — the audiobook player streams them full-size one at a
time, so it never needed thumbs. The /gallery/ grid, however, shows every
render at once, so it needs the same light `_thumb.avif` / `_thumb.webp`
tiles the other categories already have.

This script writes `<scene>_thumb.avif` and `<scene>_thumb.webp` (width
400 px, aspect preserved) next to each scene JPEG. It skips the player's
per-chapter UI thumbnails (`thumb-c*.jpg`) and anything already suffixed
`_thumb`. Idempotent unless --force is passed.

Needs Pillow + pillow-avif-plugin — run it with the data-images venv:

    ../data-images/venv/bin/python scripts/gen_cinematic_thumbs.py

Then rebuild the manifest with `python scripts/build_gallery.py` and
deploy the assets repo so the new thumbs reach the CDN.
"""
import sys
from pathlib import Path

from PIL import Image
import pillow_avif  # noqa: F401  (registers the AVIF plugin)

WWW = Path(__file__).resolve().parent.parent
CINEMATIC = WWW.parent / "assets.wheelofheaven.world" / "images" / "cinematic"
THUMB_WIDTH = 400
THUMB_SUFFIX = "_thumb"
AVIF_QUALITY = 55
WEBP_QUALITY = 72


def is_source_render(p: Path) -> bool:
    """A full scene render — not a UI chapter thumb, not a generated thumb."""
    return (
        p.suffix.lower() == ".jpg"
        and not p.stem.startswith("thumb-")
        and not p.stem.endswith(THUMB_SUFFIX)
    )


def main() -> int:
    force = "--force" in sys.argv
    if not CINEMATIC.is_dir():
        print(f"ERROR: cinematic dir not found at {CINEMATIC}", file=sys.stderr)
        return 1

    made = skipped = 0
    for book in sorted(p for p in CINEMATIC.iterdir() if p.is_dir()):
        for src in sorted(book.glob("*.jpg")):
            if not is_source_render(src):
                continue
            avif_out = book / f"{src.stem}{THUMB_SUFFIX}.avif"
            webp_out = book / f"{src.stem}{THUMB_SUFFIX}.webp"
            if not force and avif_out.exists() and webp_out.exists():
                skipped += 1
                continue
            with Image.open(src) as im:
                im = im.convert("RGB")
                w, h = im.size
                thumb = im.resize(
                    (THUMB_WIDTH, max(1, round(h * THUMB_WIDTH / w))),
                    Image.Resampling.LANCZOS,
                )
                thumb.save(avif_out, "AVIF", quality=AVIF_QUALITY)
                thumb.save(webp_out, "WEBP", quality=WEBP_QUALITY, method=6)
            made += 1

    print(f"cinematic thumbs: wrote {made}, skipped {skipped} (already present).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
