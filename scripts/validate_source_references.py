#!/usr/bin/env python3
"""Validate structured `extra.references` source IDs in content frontmatter."""

from __future__ import annotations

import json
import re
import sys
import tomllib
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
CONTENT_ROOT = PROJECT_ROOT / "content"
SOURCES_PATH = PROJECT_ROOT / "data" / "sources.json"
SOURCE_PAGES_DIR = CONTENT_ROOT / "sources" / "_generated"
SCAN_SECTIONS = ("wiki", "articles", "timeline", "library", "sources")
TRANSLATION_DIRS = {"de", "fr", "es", "ru", "ja", "ko", "zh", "zh-Hant", "he"}
FRONTMATTER_RE = re.compile(r"^\+\+\+\s*\n(.*?)\n\+\+\+\s*\n", re.DOTALL)


def parse_frontmatter(path: Path) -> dict | None:
    text = path.read_text(encoding="utf-8")
    match = FRONTMATTER_RE.match(text)
    if not match:
        return None
    try:
        return tomllib.loads(match.group(1))
    except tomllib.TOMLDecodeError as exc:
        raise ValueError(f"{path.relative_to(PROJECT_ROOT)}: TOML parse failed: {exc}") from exc


def source_ids() -> set[str]:
    with SOURCES_PATH.open(encoding="utf-8") as f:
        payload = json.load(f)
    ids = {
        source["id"]
        for source in payload.get("sources", [])
        if isinstance(source, dict) and isinstance(source.get("id"), str)
    }
    if not ids:
        raise ValueError(f"{SOURCES_PATH.relative_to(PROJECT_ROOT)} has no source IDs")
    return ids


def content_paths() -> list[Path]:
    paths: list[Path] = []
    for section in SCAN_SECTIONS:
        section_dir = CONTENT_ROOT / section
        if not section_dir.is_dir():
            continue
        paths.extend(sorted(section_dir.rglob("*.md")))
    return paths


def validate() -> int:
    ids = source_ids()
    errors: list[str] = []
    structured_count = 0
    legacy_count = 0

    if not SOURCE_PAGES_DIR.is_dir():
        errors.append(
            f"{SOURCE_PAGES_DIR.relative_to(PROJECT_ROOT)} is missing; run scripts/build_sources.py"
        )
    else:
        missing_pages = [
            source_id
            for source_id in sorted(ids)
            if not (SOURCE_PAGES_DIR / f"{source_id}.md").is_file()
        ]
        if missing_pages:
            errors.append(
                f"{SOURCE_PAGES_DIR.relative_to(PROJECT_ROOT)} is missing {len(missing_pages)} generated source page(s)"
            )

    for path in content_paths():
        rel = path.relative_to(CONTENT_ROOT)
        if rel.parts and rel.parts[0] in TRANSLATION_DIRS:
            continue

        fm = parse_frontmatter(path)
        if not fm:
            continue
        extra = fm.get("extra") or {}
        refs = extra.get("references")
        if refs is None:
            continue
        if not isinstance(refs, list):
            errors.append(f"{path.relative_to(PROJECT_ROOT)}: extra.references must be a list")
            continue

        for index, ref in enumerate(refs, start=1):
            prefix = f"{path.relative_to(PROJECT_ROOT)}: extra.references[{index}]"
            if not isinstance(ref, dict):
                errors.append(f"{prefix} must be a table/object")
                continue

            ref_id = ref.get("id")
            if ref_id is not None:
                if not isinstance(ref_id, str) or not ref_id.strip():
                    errors.append(f"{prefix}.id must be a non-empty string")
                    continue
                if ref_id not in ids:
                    errors.append(f"{prefix}.id references unknown source ID: {ref_id}")
                    continue
                structured_count += 1

                note = ref.get("note")
                if note is not None and not isinstance(note, str):
                    errors.append(f"{prefix}.note must be a string when present")
                locator = ref.get("locator")
                if locator is not None and not isinstance(locator, str):
                    errors.append(f"{prefix}.locator must be a string when present")
                continue

            title = ref.get("title")
            if isinstance(title, str) and title.strip():
                legacy_count += 1
                continue
            errors.append(f"{prefix} must include either `id` or legacy `title`")

    if errors:
        for error in errors:
            print(error, file=sys.stderr)
        print(f"source reference validation failed: {len(errors)} error(s)", file=sys.stderr)
        return 1

    print(
        "source references ok: "
        f"{structured_count} structured id reference(s), {legacy_count} legacy title reference(s)"
    )
    return 0


def main() -> None:
    raise SystemExit(validate())


if __name__ == "__main__":
    main()
