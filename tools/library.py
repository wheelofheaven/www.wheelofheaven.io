"""
Library data access functions.
"""

import json
from pathlib import Path
from typing import Iterator

# Library data directory (relative to project root)
LIBRARY_DIR = Path(__file__).parent.parent / "data" / "library"


def get_library_path() -> Path:
    """Get the library data directory path."""
    return LIBRARY_DIR


def load_catalog() -> dict:
    """Load the catalog.json file."""
    catalog_path = LIBRARY_DIR / "catalog.json"
    if not catalog_path.exists():
        return {"books": [], "traditions": [], "collections": []}

    return json.loads(catalog_path.read_text(encoding="utf-8"))


def save_catalog(catalog: dict) -> bool:
    """Save the catalog.json file."""
    catalog_path = LIBRARY_DIR / "catalog.json"
    try:
        catalog_path.write_text(
            json.dumps(catalog, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8"
        )
        return True
    except Exception as e:
        print(f"Error saving catalog: {e}")
        return False


def get_book_entry(catalog: dict, slug: str) -> dict | None:
    """Get book entry from catalog by slug."""
    for book in catalog.get("books", []):
        if book.get("slug") == slug:
            return book
    return None


def load_book(slug: str) -> dict | None:
    """Load a book's data, handling both single and split formats."""
    # Try split format first
    meta_path = LIBRARY_DIR / slug / "_meta.json"
    if meta_path.exists():
        return load_split_book(slug)

    # Fall back to single file
    book_path = LIBRARY_DIR / f"{slug}.json"
    if book_path.exists():
        return json.loads(book_path.read_text(encoding="utf-8"))

    return None


def load_split_book(slug: str) -> dict | None:
    """Load a book in split format (directory with chapter files)."""
    book_dir = LIBRARY_DIR / slug
    meta_path = book_dir / "_meta.json"

    if not meta_path.exists():
        return None

    meta = json.loads(meta_path.read_text(encoding="utf-8"))

    # Load chapters
    chapters = []
    for ch_info in meta.get("chapterFiles", []):
        chapter_path = book_dir / ch_info.get("file", "")
        if chapter_path.exists():
            chapter_data = json.loads(chapter_path.read_text(encoding="utf-8"))
            chapters.append(chapter_data)

    # Merge into single structure
    book_data = dict(meta)
    book_data["chapters"] = chapters
    book_data.pop("chapterFiles", None)
    book_data.pop("chapterCount", None)
    book_data.pop("paragraphCount", None)

    return book_data


def save_book(slug: str, book_data: dict) -> bool:
    """Save a book's data, handling both single and split formats."""
    # Check if split format exists
    meta_path = LIBRARY_DIR / slug / "_meta.json"
    if meta_path.exists():
        return save_split_book(slug, book_data)

    # Single file format
    book_path = LIBRARY_DIR / f"{slug}.json"
    try:
        book_path.write_text(
            json.dumps(book_data, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8"
        )
        return True
    except Exception as e:
        print(f"Error saving book: {e}")
        return False


def save_split_book(slug: str, book_data: dict) -> bool:
    """Save a book in split format."""
    book_dir = LIBRARY_DIR / slug

    try:
        chapters = book_data.pop("chapters", [])

        # Build chapter files list
        chapter_files = []
        total_paragraphs = 0

        for chapter in chapters:
            chapter_num = chapter.get("n", 0)
            chapter_file = f"chapter-{chapter_num}.json"
            para_count = len(chapter.get("paragraphs", []))
            total_paragraphs += para_count

            chapter_files.append({
                "n": chapter_num,
                "file": chapter_file,
                "title": chapter.get("title"),
                "paragraphs": para_count,
            })

            # Save chapter file
            chapter_path = book_dir / chapter_file
            chapter_data = dict(chapter)
            chapter_data["bookSlug"] = slug
            chapter_data["bookCode"] = book_data.get("code", "")

            chapter_path.write_text(
                json.dumps(chapter_data, indent=2, ensure_ascii=False) + "\n",
                encoding="utf-8"
            )

        # Save metadata
        meta = dict(book_data)
        meta["chapterFiles"] = chapter_files
        meta["chapterCount"] = len(chapters)
        meta["paragraphCount"] = total_paragraphs

        meta_path = book_dir / "_meta.json"
        meta_path.write_text(
            json.dumps(meta, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8"
        )

        # Restore chapters to book_data
        book_data["chapters"] = chapters

        return True
    except Exception as e:
        print(f"Error saving split book: {e}")
        return False


def iterate_paragraphs(book_data: dict) -> Iterator[tuple[dict, dict]]:
    """Iterate over all paragraphs in a book.

    Yields (chapter, paragraph) tuples.
    """
    for chapter in book_data.get("chapters", []):
        for para in chapter.get("paragraphs", []):
            yield chapter, para


def get_available_languages(book_data: dict) -> set[str]:
    """Get all languages that have at least one translation."""
    languages = set()

    primary = book_data.get("primaryLang")
    if primary:
        languages.add(primary)

    for _chapter, para in iterate_paragraphs(book_data):
        for lang in para.get("i18n", {}).keys():
            if para["i18n"][lang].strip():
                languages.add(lang)

    return languages
