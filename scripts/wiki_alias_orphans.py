#!/usr/bin/env python3
"""Wrap first-mention of orphan wiki titles in {% wiki %} shortcodes.

For each (slug, title) pair, walks English `content/` (skipping the
orphan's own file and translated lang subdirs), finds the first
case-sensitive whole-word match of `title` in the file's body (NOT
frontmatter), checks the match isn't inside an excluded region (code
block, inline code, HTML tag, markdown URL, existing shortcode/Tera
expression), and wraps as `{% wiki(slug="<slug>") %}Original Text{% end %}`.

Title-match rules:
  - Case-sensitive on the keyword portion (so "the tradition" doesn't
    match "The Tradition" entry)
  - For "The X" titles, allows leading "the" (lowercased article in
    mid-sentence position) AND "The"
  - Allows optional trailing 's' for plural usage (Great Months,
    Mass Effects)

Usage:
  python wiki_alias_orphans.py            # dry run (default)
  python wiki_alias_orphans.py --apply    # write changes
"""

import re
import sys
from pathlib import Path

REPO_ROOT = Path("/Users/zara/Development/github.com/wheelofheaven")
SITE = REPO_ROOT / "www.wheelofheaven.world"
CONTENT_DIR = SITE / "content"
WIKI_DIR = CONTENT_DIR / "wiki"

LANG_PATTERN = re.compile(r"/(?:de|es|fr|ja|ko|ru|zh|zh-Hant|he)/")
FRONTMATTER_RE = re.compile(r"^(\+\+\+\s*\n.*?\n\+\+\+\s*\n?)(.*)$", re.DOTALL)

TARGETS = [
    ("the-tradition", "The Tradition"),
    ("great-month", "Great Month"),
    ("mass-effect", "Mass Effect"),
    ("synthetic-genomics", "Synthetic genomics"),
]

# Hand-curated false-positive skips — (relative_file_path, slug) → reason
SKIP_SUBSTITUTIONS = {
    ("wiki/ancient-astronaut-hypothesis.md", "mass-effect"):
        "video game franchise reference (Mass Effect series), not the framework concept",
}


def build_pattern(title):
    if title.startswith("The "):
        rest = title[4:]
        return re.compile(r"\b[Tt]he " + re.escape(rest) + r"s?\b")
    return re.compile(r"\b" + re.escape(title) + r"s?\b")


def find_excluded_ranges(text):
    excluded = []
    for m in re.finditer(r"```.*?```", text, re.DOTALL):
        excluded.append((m.start(), m.end()))
    for m in re.finditer(r"`[^`\n]+`", text):
        excluded.append((m.start(), m.end()))
    for m in re.finditer(r"<[a-zA-Z/!][^>]*>", text):
        excluded.append((m.start(), m.end()))
    # Whole markdown links [text](url) — excludes both text and URL portions
    for m in re.finditer(r"\[[^\]]*\]\([^)]*\)", text):
        excluded.append((m.start(), m.end()))
    # Heading lines (start with #)
    for m in re.finditer(r"^#.*$", text, re.MULTILINE):
        excluded.append((m.start(), m.end()))
    for m in re.finditer(r"\{%.*?%\}", text, re.DOTALL):
        excluded.append((m.start(), m.end()))
    for m in re.finditer(r"\{\{.*?\}\}", text, re.DOTALL):
        excluded.append((m.start(), m.end()))
    return excluded


def in_ranges(pos, ranges):
    return any(s <= pos < e for s, e in ranges)


def find_first_aliasable(text, pattern):
    excluded = find_excluded_ranges(text)
    for m in pattern.finditer(text):
        if not in_ranges(m.start(), excluded):
            return m
    return None


def process_file(file_path, slug, pattern, apply_changes):
    try:
        text = file_path.read_text()
    except Exception:
        return None

    fm_match = FRONTMATTER_RE.match(text)
    if fm_match:
        frontmatter = fm_match.group(1)
        body = fm_match.group(2)
    else:
        frontmatter = ""
        body = text

    match = find_first_aliasable(body, pattern)
    if not match:
        return None

    matched_text = match.group(0)
    new_text = '{{% wiki(slug="{}") %}}{}{{% end %}}'.format(slug, matched_text)

    start, end = match.start(), match.end()
    ctx_start = max(0, start - 40)
    ctx_end = min(len(body), end + 40)
    before = body[ctx_start:ctx_end].replace("\n", "↵")
    after_segment = body[ctx_start:start] + new_text + body[end:ctx_end]
    after = after_segment.replace("\n", "↵")

    if apply_changes:
        new_body = body[:start] + new_text + body[end:]
        file_path.write_text(frontmatter + new_body)

    return {"matched": matched_text, "before": before, "after": after}


def main():
    apply_changes = "--apply" in sys.argv

    print(f"=== {'APPLYING' if apply_changes else 'DRY RUN'} ===\n")

    total_subs = 0

    for slug, title in TARGETS:
        own_file = WIKI_DIR / f"{slug}.md"
        pattern = build_pattern(title)
        print(f"## {title} (slug={slug})\n")

        file_count = 0
        for md in sorted(CONTENT_DIR.rglob("*.md")):
            if md == own_file:
                continue
            rel = str(md.relative_to(CONTENT_DIR))
            if LANG_PATTERN.search("/" + rel):
                continue

            if (rel, slug) in SKIP_SUBSTITUTIONS:
                reason = SKIP_SUBSTITUTIONS[(rel, slug)]
                # Still detect to log it; skip applying
                result = process_file(md, slug, pattern, apply_changes=False)
                if result:
                    print(f"  [SKIP] {rel}: \"{result['matched']}\" — {reason}")
                continue
            result = process_file(md, slug, pattern, apply_changes)
            if result:
                file_count += 1
                total_subs += 1
                print(f"  {rel}: \"{result['matched']}\"")
                print(f"    - {result['before']}")
                print(f"    + {result['after']}")

        print(f"  Total: {file_count} files\n")

    print(f"=== Total substitutions: {total_subs} ===")
    if not apply_changes:
        print("Re-run with --apply to write changes.")


if __name__ == "__main__":
    main()
