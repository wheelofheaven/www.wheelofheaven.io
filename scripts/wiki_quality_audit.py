#!/usr/bin/env python3
"""Wiki quality audit: claim_type presence + source-count + priority backlog.

Scans English `content/wiki/*.md` and produces:
  - .claude/plans/wiki-audit-2026-06.md   (human-readable report)
  - .claude/plans/wiki-audit-2026-06.json (per-entry diagnostic for tooling)

Quality bar:
  - `claim_type` set in [extra] (introduced 2026-04-08)
  - Six-source minimum: count [[extra.references]] entries + {% cite %} shortcodes

Date split for backfill priority:
  - Post-2026-04-01 entries missing fields are bugs (should already meet bar)
  - Pre-2026-04-01 entries are grandfathered backfill candidates

Priority ranking: by in-degree (how many other content files link TO each entry
via the {% wiki(slug=...) %} shortcode or markdown links to /wiki/<slug>/).
Translated content (under /de/, /es/, etc.) is excluded from the in-degree
count to avoid double-counting the same logical reference across languages.
"""

import json
import re
import subprocess
import tomllib
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path("/Users/zara/Development/github.com/wheelofheaven")
SITE = REPO_ROOT / "www.wheelofheaven.world"
WIKI_DIR = SITE / "content" / "wiki"
CONTENT_DIR = SITE / "content"
OUT_DIR = REPO_ROOT / ".claude" / "plans"
OUT_MD = OUT_DIR / "wiki-audit-2026-06.md"
OUT_JSON = OUT_DIR / "wiki-audit-2026-06.json"

CUTOFF_DATE = datetime(2026, 4, 1, tzinfo=timezone.utc)

VALID_CLAIM_TYPES = {"direct", "framework", "inferred", "speculative"}

LANG_PATTERN = re.compile(r"/(?:de|es|fr|ja|ko|ru|zh|zh-Hant|he)/")

FRONTMATTER_RE = re.compile(r"^\+\+\+\s*\n(.*?)\n\+\+\+\s*\n?(.*)$", re.DOTALL)
CITE_SHORTCODE_RE = re.compile(r"\{%\s*cite\s*\(", re.IGNORECASE)
WIKI_SHORTCODE_RE = re.compile(r'\{%\s*wiki\s*\(\s*slug\s*=\s*"([^"]+)"', re.IGNORECASE)
WIKI_MARKDOWN_LINK_RE = re.compile(r'\]\(/wiki/([a-z0-9\-]+)/?\)', re.IGNORECASE)


def parse_frontmatter(text):
    m = FRONTMATTER_RE.match(text)
    if not m:
        return None, text
    try:
        fm = tomllib.loads(m.group(1))
    except Exception as e:
        return {"_parse_error": str(e)}, m.group(2)
    return fm, m.group(2)


def git_last_modified(path):
    try:
        result = subprocess.run(
            ["git", "log", "-1", "--format=%aI", "--", str(path)],
            cwd=SITE,
            capture_output=True,
            text=True,
            check=False,
        )
        out = result.stdout.strip()
        if not out:
            return None
        return datetime.fromisoformat(out)
    except Exception:
        return None


def fs_last_modified(path):
    try:
        return datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc)
    except Exception:
        return None


def count_sources(fm, body):
    ref_count = 0
    if fm and isinstance(fm.get("extra"), dict):
        refs = fm["extra"].get("references", [])
        if isinstance(refs, list):
            ref_count = len(refs)
    cite_count = len(CITE_SHORTCODE_RE.findall(body))
    return ref_count + cite_count, ref_count, cite_count


def build_in_degree():
    """Count incoming links to each wiki slug across English content only."""
    in_degree = Counter()
    sources_by_slug = defaultdict(list)
    for md in CONTENT_DIR.rglob("*.md"):
        rel = str(md.relative_to(CONTENT_DIR))
        if LANG_PATTERN.search("/" + rel):
            continue
        try:
            text = md.read_text()
        except Exception:
            continue
        m = FRONTMATTER_RE.match(text)
        body = m.group(2) if m else text
        seen = set()
        for sc in WIKI_SHORTCODE_RE.finditer(body):
            seen.add(sc.group(1))
        for ml in WIKI_MARKDOWN_LINK_RE.finditer(body):
            seen.add(ml.group(1))
        # Don't count an entry's link to itself
        self_slug = md.stem if md.parent.name == "wiki" else None
        for slug in seen:
            if slug == self_slug:
                continue
            in_degree[slug] += 1
            sources_by_slug[slug].append(rel)
    return in_degree, sources_by_slug


def section_of(rel_path):
    parts = Path(rel_path).parts
    return parts[0] if parts else "root"


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    in_degree, sources_by_slug = build_in_degree()

    entries = []
    for md in sorted(WIKI_DIR.glob("*.md")):
        if md.name == "_index.md":
            continue
        slug = md.stem
        text = md.read_text()
        fm, body = parse_frontmatter(text)

        git_mod = git_last_modified(md)
        fs_mod = fs_last_modified(md)
        last_mod = git_mod or fs_mod
        last_mod_source = "git" if git_mod else ("fs" if fs_mod else "unknown")
        is_post_cutoff = last_mod is not None and last_mod >= CUTOFF_DATE

        extra = (fm or {}).get("extra", {}) if isinstance(fm, dict) else {}
        if not isinstance(extra, dict):
            extra = {}
        claim_type = extra.get("claim_type")
        claim_type_valid = claim_type in VALID_CLAIM_TYPES
        editorial_pass = extra.get("editorial_pass")

        total_sources, ref_count, cite_count = count_sources(fm, body)
        meets_six = total_sources >= 6

        title = (fm or {}).get("title", slug)

        callers = sources_by_slug.get(slug, [])
        callers_by_section = Counter(section_of(c) for c in callers)

        entries.append({
            "slug": slug,
            "title": title,
            "path": str(md.relative_to(SITE)),
            "last_modified": last_mod.isoformat() if last_mod else None,
            "last_modified_source": last_mod_source,
            "post_cutoff": is_post_cutoff,
            "claim_type": claim_type,
            "has_claim_type": claim_type_valid,
            "claim_type_invalid": claim_type is not None and not claim_type_valid,
            "editorial_pass": editorial_pass,
            "references_count": ref_count,
            "cite_shortcodes_count": cite_count,
            "total_sources": total_sources,
            "meets_six_source_minimum": meets_six,
            "in_degree": in_degree.get(slug, 0),
            "callers_by_section": dict(callers_by_section),
            "body_words": len(body.split()),
        })

    total = len(entries)
    no_claim = [e for e in entries if not e["has_claim_type"]]
    no_claim_post = [e for e in no_claim if e["post_cutoff"]]
    no_claim_pre = [e for e in no_claim if not e["post_cutoff"] and e["last_modified"]]
    no_claim_unknown = [e for e in no_claim if not e["last_modified"]]
    invalid_claim = [e for e in entries if e["claim_type_invalid"]]

    under_six = [e for e in entries if not e["meets_six_source_minimum"]]
    under_six_post = [e for e in under_six if e["post_cutoff"]]
    under_six_pre = [e for e in under_six if not e["post_cutoff"] and e["last_modified"]]

    needs_work = [e for e in entries if not e["has_claim_type"] or not e["meets_six_source_minimum"]]
    clean = [e for e in entries if e["has_claim_type"] and e["meets_six_source_minimum"]]
    orphans = [e for e in entries if e["in_degree"] == 0]

    by_priority = sorted(needs_work, key=lambda e: (-e["in_degree"], e["slug"]))

    OUT_JSON.write_text(json.dumps({
        "generated": datetime.now(timezone.utc).isoformat(),
        "cutoff_date": CUTOFF_DATE.isoformat(),
        "site_path": str(SITE),
        "total_entries": total,
        "summary": {
            "missing_claim_type": len(no_claim),
            "missing_claim_type_post_cutoff": len(no_claim_post),
            "missing_claim_type_pre_cutoff": len(no_claim_pre),
            "missing_claim_type_unknown_date": len(no_claim_unknown),
            "invalid_claim_type": len(invalid_claim),
            "under_six_sources": len(under_six),
            "under_six_sources_post_cutoff": len(under_six_post),
            "under_six_sources_pre_cutoff": len(under_six_pre),
            "clean_entries": len(clean),
            "orphan_entries": len(orphans),
        },
        "entries": entries,
    }, indent=2))

    out = []
    out.append("# Wiki Quality Audit — 2026-06\n")
    out.append("Diagnostic of `content/wiki/` (English only) against current quality standards:")
    out.append("")
    out.append("- `claim_type` set in `[extra]` (introduced 2026-04-08)")
    out.append("- Six-source minimum (per `strategy-source-program.md` decision #7)")
    out.append("")
    out.append("**Cutoff:** entries last-committed after **2026-04-01** are post-cutoff (bugs if missing fields). Before that, grandfathered — backfill at editorial discretion.")
    out.append("")
    out.append("## Summary\n")
    out.append(f"- Total wiki entries: **{total}**")
    out.append(f"- Clean (meet both standards): **{len(clean)}** ({100 * len(clean) // total if total else 0}%)")
    out.append(f"- Missing `claim_type`: **{len(no_claim)}** ({100 * len(no_claim) // total if total else 0}%)")
    out.append(f"  - Post-cutoff (bugs): **{len(no_claim_post)}**")
    out.append(f"  - Pre-cutoff (grandfathered): **{len(no_claim_pre)}**")
    out.append(f"  - Unknown commit date: **{len(no_claim_unknown)}**")
    if invalid_claim:
        out.append(f"- Invalid `claim_type` (not in {{direct, inferred, speculative}}): **{len(invalid_claim)}**")
    out.append(f"- Under six sources: **{len(under_six)}** ({100 * len(under_six) // total if total else 0}%)")
    out.append(f"  - Post-cutoff (bugs): **{len(under_six_post)}**")
    out.append(f"  - Pre-cutoff (grandfathered): **{len(under_six_pre)}**")
    out.append(f"- Orphan entries (zero in-degree): **{len(orphans)}**")
    out.append("")

    if no_claim_post or under_six_post:
        bugs_slugs = sorted({e["slug"] for e in no_claim_post + under_six_post})
        out.append(f"## Post-cutoff bugs — {len(bugs_slugs)} entries\n")
        out.append("These were committed after 2026-04-01 and should already meet the current bar.\n")
        out.append("| slug | claim_type | sources | last commit | issues |")
        out.append("|---|---|--:|---|---|")
        for slug in bugs_slugs:
            e = next(x for x in entries if x["slug"] == slug)
            issues = []
            if not e["has_claim_type"]:
                issues.append("no claim_type")
            if not e["meets_six_source_minimum"]:
                issues.append(f"only {e['total_sources']} sources")
            out.append(
                f"| `{e['slug']}` | {e['claim_type'] or '—'} | "
                f"{e['total_sources']} | "
                f"{e['last_modified'][:10] if e['last_modified'] else 'unknown'} | "
                f"{', '.join(issues)} |"
            )
        out.append("")
    else:
        out.append("## Post-cutoff bugs\n")
        out.append("None. All post-cutoff entries meet the current bar.\n")

    if invalid_claim:
        out.append(f"## Invalid `claim_type` values — {len(invalid_claim)} entries\n")
        out.append("`claim_type` must be one of `direct`, `framework`, `inferred`, `speculative`. The following use other values:\n")
        out.append("| slug | claim_type |")
        out.append("|---|---|")
        for e in sorted(invalid_claim, key=lambda x: x["slug"]):
            out.append(f"| `{e['slug']}` | `{e['claim_type']}` |")
        out.append("")

    out.append(f"## Priority backlog — top 30 backfill candidates\n")
    out.append("Ranked by in-degree (incoming links from other English content). Higher in-degree = entry sits in more places, so fixing it has more reach.\n")
    out.append("| # | slug | title | in-deg | sources | claim_type | last commit | needs |")
    out.append("|--:|---|---|--:|--:|---|---|---|")
    for i, e in enumerate(by_priority[:30], 1):
        needs = []
        if not e["has_claim_type"]:
            needs.append("claim_type")
        if not e["meets_six_source_minimum"]:
            needs.append(f"{e['total_sources']}/6 sources")
        out.append(
            f"| {i} | `{e['slug']}` | {e['title']} | {e['in_degree']} | "
            f"{e['total_sources']} | {e['claim_type'] or '—'} | "
            f"{e['last_modified'][:10] if e['last_modified'] else 'unknown'} | "
            f"{', '.join(needs)} |"
        )
    out.append("")

    out.append(f"## Clean entries — meet both standards ({len(clean)})\n")
    out.append("<details><summary>Show list</summary>\n")
    for e in sorted(clean, key=lambda x: x["slug"]):
        out.append(f"- `{e['slug']}` — {e['total_sources']} sources, `claim_type={e['claim_type']}`, in-deg={e['in_degree']}")
    out.append("\n</details>\n")

    out.append(f"## Orphan entries — zero incoming links ({len(orphans)})\n")
    out.append("These wiki entries are not linked from any English content. Either nothing references them (candidate for retirement/merge) or callers use vocabulary that doesn't match the entry's title/aliases.\n")
    out.append("<details><summary>Show list</summary>\n")
    for e in sorted(orphans, key=lambda x: x["slug"]):
        out.append(f"- `{e['slug']}` — {e['title']}")
    out.append("\n</details>\n")

    OUT_MD.write_text("\n".join(out))

    print(f"Wrote {OUT_MD.relative_to(REPO_ROOT)}")
    print(f"Wrote {OUT_JSON.relative_to(REPO_ROOT)}")
    print()
    print(f"Total: {total}")
    print(f"Clean: {len(clean)} ({100 * len(clean) // total if total else 0}%)")
    print(f"Missing claim_type: {len(no_claim)} ({len(no_claim_post)} post-cutoff bugs, {len(no_claim_pre)} grandfathered, {len(no_claim_unknown)} unknown date)")
    if invalid_claim:
        print(f"Invalid claim_type values: {len(invalid_claim)} — {[e['slug'] for e in invalid_claim]}")
    print(f"Under six sources: {len(under_six)} ({len(under_six_post)} post-cutoff bugs, {len(under_six_pre)} grandfathered)")
    print(f"Orphans (zero in-degree): {len(orphans)}")
    print()
    print("Top 5 priority backlog:")
    for i, e in enumerate(by_priority[:5], 1):
        needs = []
        if not e["has_claim_type"]:
            needs.append("claim_type")
        if not e["meets_six_source_minimum"]:
            needs.append(f"{e['total_sources']}/6 sources")
        print(f"  {i}. {e['slug']:30s} in-deg={e['in_degree']:3d}  needs: {', '.join(needs)}")


if __name__ == "__main__":
    main()
