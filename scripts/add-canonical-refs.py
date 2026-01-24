#!/usr/bin/env python3
"""
Add canonical reference IDs to library book JSON files.

This script adds Sefaria-inspired reference IDs to books in the format:
- Book code: TBWTT
- Chapter ID: TBWTT-1
- Paragraph ID: TBWTT-1:1

Usage:
    python scripts/add-canonical-refs.py
"""

import json
import os
from pathlib import Path

# Get project root
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
LIBRARY_DIR = PROJECT_ROOT / "data" / "library"


def load_catalog():
    """Load the library catalog."""
    catalog_path = LIBRARY_DIR / "catalog.json"
    with open(catalog_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def add_refs_to_book(book_path: Path, book_code: str) -> bool:
    """Add canonical reference IDs to a book JSON file."""
    print(f"Processing: {book_path.name} with code {book_code}")

    with open(book_path, 'r', encoding='utf-8') as f:
        book_data = json.load(f)

    # Add book-level reference
    book_data['code'] = book_code
    book_data['refId'] = book_code

    # Track statistics
    total_paragraphs = 0

    # Add chapter and paragraph references
    if 'chapters' in book_data:
        for chapter in book_data['chapters']:
            chapter_num = chapter.get('n', 0)
            chapter['refId'] = f"{book_code}-{chapter_num}"

            if 'paragraphs' in chapter:
                for paragraph in chapter['paragraphs']:
                    para_num = paragraph.get('n', 0)
                    paragraph['refId'] = f"{book_code}-{chapter_num}:{para_num}"
                    total_paragraphs += 1

    # Update metadata
    book_data['paragraphCount'] = total_paragraphs
    book_data['chapterCount'] = len(book_data.get('chapters', []))

    # Write back
    with open(book_path, 'w', encoding='utf-8') as f:
        json.dump(book_data, f, ensure_ascii=False, indent=2)

    print(f"  Added refs to {len(book_data.get('chapters', []))} chapters, {total_paragraphs} paragraphs")
    return True


def main():
    """Main function to process all books."""
    catalog = load_catalog()

    # Build a lookup of book slugs to codes
    book_codes = {book['slug']: book['code'] for book in catalog['books']}

    # Process each book file
    processed = 0
    for book_file in LIBRARY_DIR.glob("*.json"):
        if book_file.name == "catalog.json":
            continue

        # Get slug from filename
        slug = book_file.stem

        if slug in book_codes:
            code = book_codes[slug]
            if add_refs_to_book(book_file, code):
                processed += 1
        else:
            print(f"Warning: No catalog entry for {slug}")

    print(f"\nProcessed {processed} book(s)")


if __name__ == "__main__":
    main()
