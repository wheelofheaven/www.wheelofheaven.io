#!/usr/bin/env python3
"""
Script to wrap Hebrew text with <span class="hebrew">...</span> for proper RTL rendering.
"""

import re
import os
import sys

# Hebrew Unicode range: U+0590 to U+05FF (includes vowel points/nikkud)
# Also include some combining marks
HEBREW_PATTERN = re.compile(r'([\u0590-\u05FF]+(?:\s*/\s*[\u0590-\u05FF]+)*)')

def wrap_hebrew_in_line(line):
    """Wrap Hebrew text sequences with span tags."""
    # Skip if line already has hebrew class spans
    if 'class="hebrew"' in line or "class='hebrew'" in line:
        return line

    # Skip URL-encoded Hebrew in links (Wiktionary URLs)
    # Skip lines that are pure URLs or markdown links with encoded Hebrew
    if '%D7%' in line:  # URL-encoded Hebrew
        # Only wrap Hebrew that's NOT inside a URL
        # Split by markdown link pattern and process non-URL parts
        parts = re.split(r'(\[.*?\]\(.*?\))', line)
        result = []
        for part in parts:
            if part.startswith('[') and '](' in part:
                # This is a markdown link, don't modify
                result.append(part)
            else:
                # Wrap Hebrew in non-link parts
                result.append(HEBREW_PATTERN.sub(r'<span class="hebrew">\1</span>', part))
        return ''.join(result)

    return HEBREW_PATTERN.sub(r'<span class="hebrew">\1</span>', line)

def process_file(filepath):
    """Process a markdown file and wrap Hebrew text."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.split('\n')
    in_frontmatter = False
    frontmatter_count = 0
    new_lines = []
    modified = False

    for line in lines:
        # Track frontmatter (between +++ markers)
        if line.strip() == '+++':
            frontmatter_count += 1
            in_frontmatter = frontmatter_count == 1
            new_lines.append(line)
            continue

        if frontmatter_count == 1:
            # Inside frontmatter - skip Hebrew wrapping for now
            # (description fields would need special handling)
            new_lines.append(line)
            continue

        # Process body content
        if re.search(r'[\u0590-\u05FF]', line):
            new_line = wrap_hebrew_in_line(line)
            if new_line != line:
                modified = True
            new_lines.append(new_line)
        else:
            new_lines.append(line)

    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write('\n'.join(new_lines))
        return True
    return False

def main():
    content_dir = '/Users/zara/Development/github.com/wheelofheaven/www.wheelofheaven.io/content'

    # Language prefixes (empty string for English)
    languages = ['', 'de', 'fr', 'es', 'ru', 'ja', 'zh']
    sections = ['wiki', 'timeline', 'essentials', 'explainers']

    modified_files = []

    for lang in languages:
        for section in sections:
            if lang:
                dir_path = os.path.join(content_dir, lang, section)
            else:
                dir_path = os.path.join(content_dir, section)

            if not os.path.exists(dir_path):
                continue

            for root, dirs, files in os.walk(dir_path):
                for filename in files:
                    if filename.endswith('.md'):
                        filepath = os.path.join(root, filename)
                        if process_file(filepath):
                            modified_files.append(filepath)
                            print(f"Modified: {filepath}")

    print(f"\nTotal files modified: {len(modified_files)}")

if __name__ == '__main__':
    main()
