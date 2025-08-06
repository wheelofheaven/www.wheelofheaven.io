#!/usr/bin/env python3
"""
Generate Revelation Pages Script

This script automatically generates markdown files for revelation books
based on JSON data files in the data/revelations directory.

Usage:
    python scripts/generate-revelation-pages.py

The script will:
1. Scan the data/revelations directory for JSON files
2. Parse each JSON file to extract book metadata
3. Generate corresponding markdown files in content/revelations/
4. Only create files that don't already exist (safe to run multiple times)
"""

import json
import os
import sys
from pathlib import Path
from datetime import datetime


def load_book_data(json_file_path):
    """Load and validate book data from JSON file."""
    try:
        with open(json_file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Validate required fields
        required_fields = ['slug', 'titles', 'primaryLang']
        for field in required_fields:
            if field not in data:
                print(f"Warning: {json_file_path} missing required field: {field}")
                return None

        return data
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON file {json_file_path}: {e}")
        return None
    except Exception as e:
        print(f"Error reading file {json_file_path}: {e}")
        return None


def get_book_title(book_data, lang='en'):
    """Get the book title in the specified language, with fallbacks."""
    titles = book_data.get('titles', {})

    # Try requested language first
    if lang in titles:
        return titles[lang]

    # Fallback to English
    if 'en' in titles:
        return titles['en']

    # Fallback to primary language
    primary_lang = book_data.get('primaryLang')
    if primary_lang and primary_lang in titles:
        return titles[primary_lang]

    # Last resort: first available title
    if titles:
        return list(titles.values())[0]

    return "Untitled Book"


def get_book_description(book_data, lang='en'):
    """Generate a description for the book."""
    title = get_book_title(book_data, lang)
    chapter_count = len(book_data.get('chapters', []))

    if chapter_count == 1:
        chapter_text = "chapter"
    else:
        chapter_text = "chapters"

    return f"A revelation book containing {chapter_count} {chapter_text} of sacred teachings and dialogues."


def generate_markdown_content(book_data, lang='en'):
    """Generate the markdown content for a book page."""
    title = get_book_title(book_data, lang)
    description = get_book_description(book_data, lang)
    slug = book_data['slug']

    # Create the front matter
    front_matter = f"""+++
title = "{title}"
slug = "{slug}"
description = "{description}"
template = "revelation-book.html"
"""

    # Add additional metadata if available
    if 'updated' in book_data:
        front_matter += f'date = "{book_data["updated"]}"\n'

    front_matter += "+++"

    # Create the content
    content = f"""
This page displays "{title}" with interactive features for viewing the original text alongside translations in multiple languages.

The book contains {len(book_data.get('chapters', []))} chapters and is available in the following languages:
"""

    # Add language list
    for lang_code, lang_title in book_data.get('titles', {}).items():
        content += f"- **{lang_code.upper()}**: {lang_title}\n"

    content += """
## Features

- **Original Text**: View the text in its original language
- **Multiple Translations**: Switch between different language translations
- **Side-by-Side View**: Compare original and translated text side by side
- **Chapter Navigation**: Easy navigation between chapters
- **Responsive Design**: Optimized for both desktop and mobile reading

## Reading Instructions

1. Use the language selector to choose your preferred translation
2. Toggle the "Side-by-side view" to compare original and translated text
3. Each paragraph is numbered for easy reference
4. Different speakers are color-coded for clarity
"""

    return front_matter + content


def main():
    """Main function to generate revelation pages."""
    # Get the project root directory
    script_dir = Path(__file__).parent
    project_root = script_dir.parent

    # Define paths
    data_dir = project_root / "data" / "revelations"
    content_dir = project_root / "content" / "revelations"

    print(f"Scanning for JSON files in: {data_dir}")
    print(f"Generating markdown files in: {content_dir}")

    # Check if directories exist
    if not data_dir.exists():
        print(f"Error: Data directory does not exist: {data_dir}")
        sys.exit(1)

    if not content_dir.exists():
        print(f"Error: Content directory does not exist: {content_dir}")
        sys.exit(1)

    # Find all JSON files in the data directory
    json_files = list(data_dir.glob("*.json"))

    if not json_files:
        print("No JSON files found in the data directory.")
        return

    print(f"Found {len(json_files)} JSON file(s)")

    generated_count = 0
    skipped_count = 0
    error_count = 0

    # Process each JSON file
    for json_file in json_files:
        print(f"\nProcessing: {json_file.name}")

        # Load book data
        book_data = load_book_data(json_file)
        if not book_data:
            error_count += 1
            continue

        slug = book_data['slug']
        markdown_file = content_dir / f"{slug}.md"

        # Check if markdown file already exists
        if markdown_file.exists():
            print(f"  Skipped: {markdown_file.name} already exists")
            skipped_count += 1
            continue

        # Generate markdown content
        try:
            markdown_content = generate_markdown_content(book_data)

            # Write the markdown file
            with open(markdown_file, 'w', encoding='utf-8') as f:
                f.write(markdown_content)

            print(f"  Generated: {markdown_file.name}")
            generated_count += 1

        except Exception as e:
            print(f"  Error generating {markdown_file.name}: {e}")
            error_count += 1

    # Print summary
    print(f"\n--- Summary ---")
    print(f"Generated: {generated_count} files")
    print(f"Skipped: {skipped_count} files (already exist)")
    print(f"Errors: {error_count} files")

    if generated_count > 0:
        print(f"\nRun 'zola build' to rebuild the site with the new pages.")


def update_revelations_index():
    """Update the revelations section template to automatically include all books."""
    print("\nUpdating revelations section template...")

    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    data_dir = project_root / "data" / "revelations"

    # Get all JSON files
    json_files = list(data_dir.glob("*.json"))
    book_files_list = [f'"{f.name}"' for f in json_files]

    print(f"Found books: {', '.join(book_files_list)}")

    # Create the updated book files list for the template
    book_files_str = "[" + ", ".join(book_files_list) + "]"

    print(f"Book files array: {book_files_str}")
    print("Manual update needed: Update the book_files variable in templates/revelations-section.html")


if __name__ == "__main__":
    print("Revelation Pages Generator")
    print("=" * 40)

    try:
        main()
        update_revelations_index()
    except KeyboardInterrupt:
        print("\nOperation cancelled by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\nUnexpected error: {e}")
        sys.exit(1)
