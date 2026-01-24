#!/usr/bin/env python3
"""
Split a single-file book JSON into per-chapter files.

Usage:
    python scripts/split-book-chapters.py [book-slug]

If no book-slug is provided, processes all books over 100KB.

Creates:
    data/library/{book-slug}/
        _meta.json         - Book metadata
        chapter-1.json     - Chapter 1 content
        chapter-2.json     - Chapter 2 content
        ...

Updates catalog.json to set format: "split" for processed books.
"""

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

# Configuration
LIBRARY_DIR = Path(__file__).parent.parent / "data" / "library"
SIZE_THRESHOLD_KB = 100  # Split books larger than this


def load_catalog():
    """Load the catalog.json file."""
    catalog_path = LIBRARY_DIR / "catalog.json"
    if not catalog_path.exists():
        print(f"Error: {catalog_path} not found")
        sys.exit(1)

    with open(catalog_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_catalog(catalog):
    """Save the catalog.json file."""
    catalog_path = LIBRARY_DIR / "catalog.json"
    with open(catalog_path, 'w', encoding='utf-8') as f:
        json.dump(catalog, f, indent=2, ensure_ascii=False)
        f.write('\n')


def get_book_entry(catalog, slug):
    """Get book entry from catalog by slug."""
    for book in catalog['books']:
        if book['slug'] == slug:
            return book
    return None


def split_book(book_path, catalog):
    """Split a book into per-chapter files."""
    slug = book_path.stem

    # Check if already split
    book_dir = LIBRARY_DIR / slug
    if book_dir.exists() and (book_dir / "_meta.json").exists():
        print(f"  Skipping {slug}: already split")
        return False

    # Load book
    with open(book_path, 'r', encoding='utf-8') as f:
        book_data = json.load(f)

    if 'chapters' not in book_data or not book_data['chapters']:
        print(f"  Skipping {slug}: no chapters found")
        return False

    # Get book code from catalog
    book_entry = get_book_entry(catalog, slug)
    book_code = book_entry.get('code', '') if book_entry else ''

    # Create book directory
    book_dir.mkdir(exist_ok=True)

    # Calculate totals
    total_paragraphs = sum(len(ch.get('paragraphs', [])) for ch in book_data['chapters'])

    # Create chapter files list for metadata
    chapter_files = []

    for chapter in book_data['chapters']:
        chapter_num = chapter['n']
        chapter_file = f"chapter-{chapter_num}.json"

        # Build chapter data
        chapter_data = {
            "n": chapter_num,
            "bookSlug": slug,
            "bookCode": book_code,
            "refId": f"{book_code}-{chapter_num}" if book_code else None,
            "title": chapter.get('title'),
            "i18n": chapter.get('i18n', {}),
            "paragraphs": chapter.get('paragraphs', [])
        }

        # Remove None values
        chapter_data = {k: v for k, v in chapter_data.items() if v is not None}

        # Write chapter file
        chapter_path = book_dir / chapter_file
        with open(chapter_path, 'w', encoding='utf-8') as f:
            json.dump(chapter_data, f, indent=2, ensure_ascii=False)
            f.write('\n')

        chapter_files.append({
            "n": chapter_num,
            "file": chapter_file,
            "title": chapter.get('title'),
            "paragraphs": len(chapter.get('paragraphs', []))
        })

        print(f"    Created {chapter_file} ({len(chapter.get('paragraphs', []))} paragraphs)")

    # Create metadata file
    meta_data = {
        "slug": book_data.get('slug', slug),
        "code": book_code or book_data.get('code'),
        "refId": book_code or None,
        "titles": book_data.get('titles', {}),
        "publicationYear": book_data.get('publicationYear'),
        "primaryLang": book_data.get('primaryLang'),
        "schema": book_data.get('schema', ["book", "chapters", "paragraphs"]),
        "revision": book_data.get('revision', 1),
        "updated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "chapterCount": len(book_data['chapters']),
        "paragraphCount": total_paragraphs,
        "chapterFiles": chapter_files
    }

    # Remove None values
    meta_data = {k: v for k, v in meta_data.items() if v is not None}

    meta_path = book_dir / "_meta.json"
    with open(meta_path, 'w', encoding='utf-8') as f:
        json.dump(meta_data, f, indent=2, ensure_ascii=False)
        f.write('\n')

    print(f"    Created _meta.json")

    # Update catalog to mark as split
    if book_entry:
        book_entry['format'] = 'split'

    return True


def main():
    catalog = load_catalog()

    # Determine which books to process
    if len(sys.argv) > 1:
        # Process specific book
        slugs = sys.argv[1:]
    else:
        # Process all large books
        slugs = []
        for json_file in LIBRARY_DIR.glob("*.json"):
            if json_file.name == "catalog.json":
                continue

            size_kb = json_file.stat().st_size / 1024
            if size_kb > SIZE_THRESHOLD_KB:
                slugs.append(json_file.stem)
                print(f"Found large book: {json_file.name} ({size_kb:.1f} KB)")

    if not slugs:
        print("No books to process.")
        return

    # Process books
    processed = 0
    for slug in slugs:
        book_path = LIBRARY_DIR / f"{slug}.json"
        if not book_path.exists():
            print(f"Warning: {book_path} not found, skipping")
            continue

        print(f"\nProcessing: {slug}")
        if split_book(book_path, catalog):
            processed += 1

    # Save updated catalog
    if processed > 0:
        catalog['updated'] = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        save_catalog(catalog)
        print(f"\nUpdated catalog.json")

    print(f"\nSplit {processed} book(s)")


if __name__ == "__main__":
    main()
