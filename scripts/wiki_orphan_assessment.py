#!/usr/bin/env python3
"""Classify wiki orphan entries (zero in-degree) by likely cause.

Reads `.claude/plans/wiki-audit-2026-06.json` (produced by wiki_quality_audit.py),
extracts the orphans, and for each one:
  - parses its frontmatter for title + alternative_names
  - searches English content/ for raw whole-word mentions of those terms
  - cross-checks against other wiki entries' alternative_names (alias collision)
  - tags one or more category labels

Categories (an orphan may carry several):
  - `stub`               body_words < 200; needs development regardless
  - `alias-collision`    title or alias overlaps with another wiki entry's
                         title/alias — likely duplicate or already-aliased
  - `unaliased-mentions` title/alias appears as raw text in other English
                         content; aliasing-shortcode opportunity
  - `generic-term`       title is a short common single word; raw-text
                         search produces noisy results — needs human review
  - `true-ghost`         no mentions found anywhere; candidate for retire/merge

Output: `.claude/plans/wiki-orphan-assessment-2026-06.md`
"""

import json
import re
import tomllib
from collections import defaultdict
from pathlib import Path

REPO_ROOT = Path("/Users/zara/Development/github.com/wheelofheaven")
SITE = REPO_ROOT / "www.wheelofheaven.world"
WIKI_DIR = SITE / "content" / "wiki"
CONTENT_DIR = SITE / "content"
AUDIT_JSON = REPO_ROOT / ".claude" / "plans" / "wiki-audit-2026-06.json"
OUT_MD = REPO_ROOT / ".claude" / "plans" / "wiki-orphan-assessment-2026-06.md"

LANG_PATTERN = re.compile(r"/(?:de|es|fr|ja|ko|ru|zh|zh-Hant|he)/")
FRONTMATTER_RE = re.compile(r"^\+\+\+\s*\n(.*?)\n\+\+\+\s*\n?(.*)$", re.DOTALL)

# Short common single-word titles likely to produce noisy raw-text matches
GENERIC_WORDS = {
    "hebrew", "menorah", "swastika", "samsara", "ufology", "mytheme",
    "pantropy", "forerunners",
}

# Terms shorter than this are excluded from raw-text search (too noisy)
MIN_SEARCH_TERM_LEN = 5


def parse_frontmatter(text):
    m = FRONTMATTER_RE.match(text)
    if not m:
        return None, text
    try:
        return tomllib.loads(m.group(1)), m.group(2)
    except Exception:
        return None, m.group(2)


def load_wiki_terms():
    """Return (slug -> {title, aliases}, term -> set(slugs))."""
    by_slug = {}
    term_index = defaultdict(set)
    for md in sorted(WIKI_DIR.glob("*.md")):
        if md.name == "_index.md":
            continue
        slug = md.stem
        fm, _ = parse_frontmatter(md.read_text())
        if not fm:
            continue
        title = fm.get("title", slug)
        extra = fm.get("extra", {}) if isinstance(fm.get("extra"), dict) else {}
        aliases = extra.get("alternative_names", []) or []
        by_slug[slug] = {"title": title, "aliases": list(aliases)}
        for term in [title] + list(aliases):
            key = term.lower().strip()
            if len(key) >= MIN_SEARCH_TERM_LEN:
                term_index[key].add(slug)
    return by_slug, term_index


def find_text_mentions(terms, exclude_path):
    """Return {term -> list of (rel_path, count)} for whole-word mentions in
    English content excluding the orphan's own file."""
    if not terms:
        return {}
    # Build one regex with alternation
    pattern_parts = [re.escape(t) for t in sorted(terms, key=len, reverse=True)]
    pattern = re.compile(r"\b(" + "|".join(pattern_parts) + r")\b", re.IGNORECASE)
    hits = defaultdict(list)
    for md in CONTENT_DIR.rglob("*.md"):
        if md == exclude_path:
            continue
        rel = str(md.relative_to(CONTENT_DIR))
        if LANG_PATTERN.search("/" + rel):
            continue
        try:
            text = md.read_text()
        except Exception:
            continue
        m = FRONTMATTER_RE.match(text)
        body = m.group(2) if m else text
        # Don't count alternative_names declarations in OTHER wiki entries
        # as "mentions" — those are aliasing infrastructure, not text references
        if md.parent.name == "wiki" and m:
            search_text = body
        else:
            search_text = text
        matches = pattern.findall(search_text)
        if matches:
            counts = defaultdict(int)
            for hit in matches:
                counts[hit.lower()] += 1
            for term, n in counts.items():
                hits[term].append((rel, n))
    return dict(hits)


def main():
    audit = json.loads(AUDIT_JSON.read_text())
    orphans = [e for e in audit["entries"] if e["in_degree"] == 0]
    by_slug, term_index = load_wiki_terms()

    results = []
    for orphan in sorted(orphans, key=lambda e: e["slug"]):
        slug = orphan["slug"]
        path = WIKI_DIR / f"{slug}.md"
        info = by_slug.get(slug, {"title": orphan["title"], "aliases": []})
        title = info["title"]
        aliases = info["aliases"]
        body_words = orphan["body_words"]

        # Alias collision: does this orphan's title/alias appear as title or alias
        # in another wiki entry?
        collisions = set()
        for term in [title] + aliases:
            key = term.lower().strip()
            if len(key) < MIN_SEARCH_TERM_LEN:
                continue
            other_slugs = term_index.get(key, set()) - {slug}
            collisions.update(other_slugs)

        # Generic-term detection
        is_generic = (
            title.lower().strip() in GENERIC_WORDS
            or (len(title.split()) == 1 and len(title) < 7)
        )

        # Raw-text mentions in other English content (excluding very generic terms)
        search_terms = []
        for term in [title] + aliases:
            key = term.lower().strip()
            if len(key) < MIN_SEARCH_TERM_LEN:
                continue
            if key in GENERIC_WORDS:
                continue
            search_terms.append(term)

        mention_map = find_text_mentions(search_terms, path) if search_terms else {}
        total_mentions = sum(sum(n for _, n in hits) for hits in mention_map.values())
        mention_files = sorted({f for hits in mention_map.values() for f, _ in hits})

        tags = []
        if body_words < 200:
            tags.append("stub")
        if collisions:
            tags.append("alias-collision")
        if is_generic:
            tags.append("generic-term")
        if total_mentions > 0 and "generic-term" not in tags:
            tags.append("unaliased-mentions")
        if total_mentions == 0 and "stub" not in tags and "generic-term" not in tags and not collisions:
            tags.append("true-ghost")

        results.append({
            "slug": slug,
            "title": title,
            "aliases": aliases,
            "body_words": body_words,
            "collisions": sorted(collisions),
            "total_mentions": total_mentions,
            "mention_files_count": len(mention_files),
            "top_mention_files": mention_files[:5],
            "tags": tags,
        })

    # Build report
    out = []
    out.append("# Wiki Orphan Assessment — 2026-06\n")
    out.append(f"Classification of the {len(results)} orphan wiki entries identified by the quality audit (zero in-degree from English content).\n")
    out.append("## Tag definitions\n")
    out.append("- **`stub`** — body < 200 words; needs development regardless of orphan status")
    out.append("- **`alias-collision`** — title or alias overlaps with another wiki entry; likely duplicate or already-aliased")
    out.append("- **`unaliased-mentions`** — title/alias appears as raw text in other English content; aliasing opportunity (add `{% wiki %}` shortcodes where mentioned)")
    out.append("- **`generic-term`** — single common-English word title; raw-text search too noisy to be reliable, needs human review")
    out.append("- **`true-ghost`** — no mentions anywhere; candidate for retire / merge / fundamental re-scoping\n")

    # Summary by tag
    from collections import Counter
    tag_counts = Counter()
    for r in results:
        for t in r["tags"]:
            tag_counts[t] += 1
    out.append("## Tag tallies\n")
    for tag, n in tag_counts.most_common():
        out.append(f"- `{tag}` — **{n}** entries")
    out.append("")

    # Stub section
    stubs = [r for r in results if "stub" in r["tags"]]
    if stubs:
        out.append(f"## Stubs — develop or retire ({len(stubs)})\n")
        out.append("Body word counts under 200. These are placeholder pages.\n")
        out.append("| slug | title | body words | other tags |")
        out.append("|---|---|--:|---|")
        for r in sorted(stubs, key=lambda x: x["body_words"]):
            other_tags = [t for t in r["tags"] if t != "stub"]
            out.append(f"| `{r['slug']}` | {r['title']} | {r['body_words']} | {', '.join(other_tags) or '—'} |")
        out.append("")

    # Alias collisions
    collisions = [r for r in results if "alias-collision" in r["tags"]]
    if collisions:
        out.append(f"## Alias collisions — likely duplicates ({len(collisions)})\n")
        out.append("These orphans share a title or alias with another wiki entry. Probably either: a duplicate that should be merged, or an alias that's already set up (and the orphan can be retired) — but the audit can't tell which.\n")
        out.append("| slug | title | colliding-with |")
        out.append("|---|---|---|")
        for r in sorted(collisions, key=lambda x: x["slug"]):
            out.append(f"| `{r['slug']}` | {r['title']} | {', '.join('`'+s+'`' for s in r['collisions'])} |")
        out.append("")

    # Unaliased mentions — the big opportunity
    unaliased = [r for r in results if "unaliased-mentions" in r["tags"]]
    if unaliased:
        out.append(f"## Unaliased mentions — linking opportunities ({len(unaliased)})\n")
        out.append("These orphans have substantial bodies, no in-links, but their titles/aliases appear as raw text in other English content. Wrap those mentions in `{{% wiki(slug=\"...\") %}}` shortcodes (or markdown wiki-links) to give the entry incoming traffic.\n")
        out.append("Ranked by raw mention count (more mentions = more aliasing leverage).\n")
        out.append("| slug | title | mentions | files | top files |")
        out.append("|---|---|--:|--:|---|")
        for r in sorted(unaliased, key=lambda x: -x["total_mentions"]):
            top = ", ".join(r["top_mention_files"][:3])
            out.append(f"| `{r['slug']}` | {r['title']} | {r['total_mentions']} | {r['mention_files_count']} | {top} |")
        out.append("")

    # Generic terms
    generic = [r for r in results if "generic-term" in r["tags"]]
    if generic:
        out.append(f"## Generic single-word terms — needs human review ({len(generic)})\n")
        out.append("Title is a short single common-English word. Raw-text search would produce too many false positives to be reliable. Human review needed to assess whether these are genuine orphans, or whether common-word usage masks real references.\n")
        for r in sorted(generic, key=lambda x: x["slug"]):
            out.append(f"- `{r['slug']}` — {r['title']} ({r['body_words']} words)")
        out.append("")

    # True ghosts
    ghosts = [r for r in results if "true-ghost" in r["tags"]]
    if ghosts:
        out.append(f"## True ghosts — retire / merge / re-scope ({len(ghosts)})\n")
        out.append("Substantial body, no incoming links, no raw-text mentions anywhere in English content. The topic is in the wiki but nothing else in the project touches it. Either: retire (if the topic isn't actually in-scope), merge (if folded into a sibling entry), or fundamental re-scoping (rewrite to anchor to something the rest of the corpus uses).\n")
        out.append("| slug | title | body words |")
        out.append("|---|---|--:|")
        for r in sorted(ghosts, key=lambda x: -x["body_words"]):
            out.append(f"| `{r['slug']}` | {r['title']} | {r['body_words']} |")
        out.append("")

    OUT_MD.write_text("\n".join(out))

    # Console summary
    print(f"Wrote {OUT_MD.relative_to(REPO_ROOT)}")
    print()
    print(f"Total orphans: {len(results)}")
    for tag, n in tag_counts.most_common():
        print(f"  {tag:24s} {n}")
    if ghosts:
        print()
        print(f"True ghosts ({len(ghosts)}):")
        for r in sorted(ghosts, key=lambda x: -x["body_words"]):
            print(f"  {r['slug']:40s} {r['body_words']} words")


if __name__ == "__main__":
    main()
