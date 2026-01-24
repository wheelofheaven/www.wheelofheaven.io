#!/usr/bin/env python3
"""
Convert Hugo figure shortcodes to Zola syntax with CDN paths.

From: {{< figure src="images/equinox_bc8850.png" caption="Fig. 1 - Vernal equinox" >}}
To:   {{ figure(src="timeline/equinox_bc8850", caption="Fig. 1 - Vernal equinox") }}

The script:
1. Finds all {{< figure ... >}} patterns
2. Extracts src and caption attributes
3. Converts image paths to CDN paths (removes "images/" prefix and extension)
4. Determines CDN category based on image name
5. Rewrites in Zola shortcode syntax
"""

import re
import sys
from pathlib import Path

# Map image names to CDN categories
# Images are categorized in data-images/manifest.yaml
TIMELINE_IMAGES = {
    "equinox_1945", "equinox_bc11010", "equinox_bc13170", "equinox_bc15330",
    "equinox_bc17490", "equinox_bc19650", "equinox_bc210", "equinox_bc21810",
    "equinox_bc2370", "equinox_bc4530", "equinox_bc6690", "equinox_bc8850",
    "20202003_vernal_equinox_stellarium", "hubble-cosmic-web", "precession_schema",
    "muse-deep-space"
}

LIBRARY_IMAGES = {
    "ces-dieux-qui-firent-le-ciel-et-la-terre-book", "dhorme-bible-books",
    "escaping-from-eden-book", "gospel-in-the-stars-book", "hamlets-mill-book",
    "l-ere-du-verseau-book", "la-bibbia-non-e-un-libro-sacro-book",
    "la-lune-cle-de-la-bible-book", "le-message-book", "mazzaroth-rolleston-book",
    "mccall_the_prologue_and_the_promise", "the-scars-of-eden-book",
    "the-zohar-pritzker-edition-book", "wonders-in-the-sky-book"
}

BACKGROUND_IMAGES = {"moodscape_01", "moodscape_02", "moodscape_03", "moodscape_04"}

OG_IMAGES = {"wheel-of-heaven-background", "wheel-of-heaven-banner"}

ICON_IMAGES = {"renderings-raelian-symbol-of-infinity"}


def get_cdn_category(image_name: str) -> str:
    """Determine CDN category based on image name."""
    if image_name in TIMELINE_IMAGES:
        return "timeline"
    elif image_name in LIBRARY_IMAGES:
        return "library"
    elif image_name in BACKGROUND_IMAGES:
        return "backgrounds"
    elif image_name in OG_IMAGES:
        return "og"
    elif image_name in ICON_IMAGES:
        return "icons"
    else:
        return "wiki"  # Default category


def parse_hugo_figure(match: str) -> dict:
    """Parse Hugo figure shortcode and extract attributes."""
    result = {}

    # Extract src
    src_match = re.search(r'src="([^"]*)"', match)
    if src_match:
        result['src'] = src_match.group(1)

    # Extract caption
    caption_match = re.search(r'caption="([^"]*)"', match)
    if caption_match:
        result['caption'] = caption_match.group(1)

    # Extract alt (if present)
    alt_match = re.search(r'alt="([^"]*)"', match)
    if alt_match:
        result['alt'] = alt_match.group(1)

    return result


def convert_src_to_cdn_path(src: str) -> str:
    """Convert Hugo image path to CDN path."""
    # Remove "images/" prefix if present
    if src.startswith("images/"):
        src = src[7:]

    # Remove file extension
    path = Path(src)
    image_name = path.stem

    # Determine category
    category = get_cdn_category(image_name)

    return f"{category}/{image_name}"


def convert_to_zola(attrs: dict) -> str:
    """Convert parsed attributes to Zola shortcode syntax."""
    if 'src' not in attrs:
        return None

    cdn_path = convert_src_to_cdn_path(attrs['src'])

    parts = [f'src="{cdn_path}"']

    if 'caption' in attrs:
        # Escape any quotes in caption
        caption = attrs['caption'].replace('"', '\\"')
        parts.append(f'caption="{caption}"')

    if 'alt' in attrs:
        alt = attrs['alt'].replace('"', '\\"')
        parts.append(f'alt="{alt}"')

    return '{{ figure(' + ', '.join(parts) + ') }}'


def convert_file(filepath: Path, dry_run: bool = False) -> int:
    """Convert all figure shortcodes in a file."""
    content = filepath.read_text(encoding='utf-8')
    original = content

    # Pattern to match Hugo figure shortcodes
    pattern = r'\{\{<\s*figure\s+([^>]+)\s*>\}\}'

    def replace_match(match):
        full_match = match.group(0)
        attrs_str = match.group(1)

        # Parse attributes
        attrs = parse_hugo_figure(full_match)

        # Convert to Zola
        zola = convert_to_zola(attrs)

        if zola:
            return zola
        else:
            # Keep original if conversion fails
            return full_match

    converted = re.sub(pattern, replace_match, content)

    if converted != original:
        count = len(re.findall(pattern, original))
        if not dry_run:
            filepath.write_text(converted, encoding='utf-8')
        return count

    return 0


def main():
    import argparse

    parser = argparse.ArgumentParser(description='Convert Hugo figure shortcodes to Zola')
    parser.add_argument('--dry-run', '-n', action='store_true', help='Show what would be changed')
    parser.add_argument('--path', '-p', type=Path, default=Path('content'), help='Content directory')
    args = parser.parse_args()

    content_dir = args.path
    if not content_dir.exists():
        print(f"Error: {content_dir} not found")
        sys.exit(1)

    total_converted = 0
    files_modified = 0

    for md_file in content_dir.rglob('*.md'):
        count = convert_file(md_file, dry_run=args.dry_run)
        if count > 0:
            print(f"  {'[DRY RUN] ' if args.dry_run else ''}Converted {count} shortcodes in {md_file.relative_to(content_dir)}")
            total_converted += count
            files_modified += 1

    print()
    print(f"{'Would convert' if args.dry_run else 'Converted'}: {total_converted} shortcodes in {files_modified} files")


if __name__ == '__main__':
    main()
