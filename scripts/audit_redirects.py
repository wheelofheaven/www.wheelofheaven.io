#!/usr/bin/env python3
"""
Redirect Audit Script for Wheel of Heaven Migration

Compares old URLs (from legacy site) against:
1. Current site URLs
2. Zola aliases in content frontmatter
3. _redirects file rules

Outputs a report of missing redirects that could cause SEO issues.
"""

import os
import re
import subprocess
from pathlib import Path
from typing import Set, Dict, List
from dataclasses import dataclass

# Paths
PROJECT_ROOT = Path(__file__).parent.parent
LEGACY_ROOT = PROJECT_ROOT.parent / "www.wheelofheaven.io-legacy"
CONTENT_DIR = PROJECT_ROOT / "content"
REDIRECTS_FILE = PROJECT_ROOT / "static" / "_redirects"
PUBLIC_DIR = PROJECT_ROOT / "public"


@dataclass
class AuditResult:
    old_url: str
    status: str  # "ok", "redirect", "missing"
    target: str = ""
    source: str = ""  # "alias", "_redirects", "same_url"


def get_legacy_urls() -> Set[str]:
    """Extract all content URLs from legacy site."""
    urls = set()
    legacy_content = LEGACY_ROOT / "content"

    if not legacy_content.exists():
        print(f"Warning: Legacy content not found at {legacy_content}")
        return urls

    for md_file in legacy_content.rglob("*.md"):
        rel_path = md_file.relative_to(legacy_content)
        # Convert path to URL
        url = "/" + str(rel_path).replace("_index.md", "").replace("index.md", "").replace(".md", "/")
        url = url.rstrip("/") + "/"
        # Normalize
        url = re.sub(r'/+', '/', url)
        urls.add(url)

    return urls


def get_current_urls() -> Set[str]:
    """Extract all content URLs from current site."""
    urls = set()

    for md_file in CONTENT_DIR.rglob("*.md"):
        rel_path = md_file.relative_to(CONTENT_DIR)
        url = "/" + str(rel_path).replace("_index.md", "").replace("index.md", "").replace(".md", "/")
        url = url.rstrip("/") + "/"
        url = re.sub(r'/+', '/', url)
        urls.add(url)

    return urls


def get_zola_aliases() -> Dict[str, str]:
    """Extract aliases from content frontmatter -> maps alias to target."""
    aliases = {}

    for md_file in CONTENT_DIR.rglob("*.md"):
        content = md_file.read_text(encoding="utf-8", errors="ignore")

        # Extract frontmatter
        if content.startswith("+++"):
            parts = content.split("+++", 2)
            if len(parts) >= 3:
                frontmatter = parts[1]

                # Find aliases
                alias_match = re.search(r'aliases\s*=\s*\[(.*?)\]', frontmatter, re.DOTALL)
                if alias_match:
                    alias_str = alias_match.group(1)
                    found_aliases = re.findall(r'"([^"]+)"', alias_str)

                    # Get target URL
                    rel_path = md_file.relative_to(CONTENT_DIR)
                    target = "/" + str(rel_path).replace("_index.md", "").replace("index.md", "").replace(".md", "/")
                    target = target.rstrip("/") + "/"
                    target = re.sub(r'/+', '/', target)

                    for alias in found_aliases:
                        alias = alias.rstrip("/") + "/"
                        aliases[alias] = target

    return aliases


def get_redirects_rules() -> Dict[str, str]:
    """Parse _redirects file -> maps source to target."""
    rules = {}

    if not REDIRECTS_FILE.exists():
        return rules

    for line in REDIRECTS_FILE.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue

        parts = line.split()
        if len(parts) >= 2:
            source = parts[0].rstrip("/") + "/"
            target = parts[1].rstrip("/") + "/"
            # Skip wildcards for now (handled separately)
            if "*" not in source:
                rules[source] = target

    return rules


def get_wildcard_rules() -> List[tuple]:
    """Get wildcard redirect rules."""
    wildcards = []

    if not REDIRECTS_FILE.exists():
        return wildcards

    for line in REDIRECTS_FILE.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue

        parts = line.split()
        if len(parts) >= 2 and ("*" in parts[0] or ":slug" in parts[0]):
            # Convert Cloudflare-style patterns to regex
            pattern = parts[0]
            pattern = pattern.replace(":slug", "[^/]+")
            pattern = pattern.replace("*", ".*")
            pattern = "^" + pattern + "$"
            target = parts[1]
            wildcards.append((pattern, target))

    return wildcards


def check_wildcard_match(url: str, wildcards: List[tuple]) -> str:
    """Check if URL matches any wildcard rule."""
    for pattern, target in wildcards:
        if re.match(pattern, url):
            return target
    return ""


def audit_redirects() -> List[AuditResult]:
    """Main audit function."""
    results = []

    print("Loading URLs...")
    legacy_urls = get_legacy_urls()
    current_urls = get_current_urls()
    aliases = get_zola_aliases()
    redirects = get_redirects_rules()
    wildcards = get_wildcard_rules()

    print(f"  Legacy URLs: {len(legacy_urls)}")
    print(f"  Current URLs: {len(current_urls)}")
    print(f"  Zola aliases: {len(aliases)}")
    print(f"  _redirects rules: {len(redirects)}")
    print(f"  Wildcard rules: {len(wildcards)}")
    print()

    # Check each legacy URL
    for old_url in sorted(legacy_urls):
        # Skip non-English for now (focus on main content)
        if old_url.startswith("/en/"):
            old_url = old_url[3:]  # Remove /en/ prefix

        # 1. Check if URL exists in current site (same path)
        if old_url in current_urls:
            results.append(AuditResult(old_url, "ok", old_url, "same_url"))
            continue

        # 2. Check Zola aliases
        if old_url in aliases:
            results.append(AuditResult(old_url, "redirect", aliases[old_url], "alias"))
            continue

        # 3. Check _redirects rules
        if old_url in redirects:
            results.append(AuditResult(old_url, "redirect", redirects[old_url], "_redirects"))
            continue

        # 4. Check wildcard rules
        wildcard_target = check_wildcard_match(old_url, wildcards)
        if wildcard_target:
            results.append(AuditResult(old_url, "redirect", wildcard_target, "wildcard"))
            continue

        # 5. Missing redirect
        results.append(AuditResult(old_url, "missing", "", ""))

    return results


def print_report(results: List[AuditResult]):
    """Print audit report."""
    ok_count = sum(1 for r in results if r.status == "ok")
    redirect_count = sum(1 for r in results if r.status == "redirect")
    missing_count = sum(1 for r in results if r.status == "missing")

    print("=" * 60)
    print("REDIRECT AUDIT REPORT")
    print("=" * 60)
    print()
    print(f"Total legacy URLs checked: {len(results)}")
    print(f"  ✓ Same URL exists:       {ok_count}")
    print(f"  → Redirected:            {redirect_count}")
    print(f"  ✗ Missing redirect:      {missing_count}")
    print()

    if missing_count > 0:
        print("-" * 60)
        print("MISSING REDIRECTS (potential SEO issues)")
        print("-" * 60)
        for r in results:
            if r.status == "missing":
                print(f"  {r.old_url}")
        print()

    # Group redirects by source
    by_source = {}
    for r in results:
        if r.status == "redirect":
            by_source.setdefault(r.source, []).append(r)

    print("-" * 60)
    print("REDIRECT COVERAGE BY SOURCE")
    print("-" * 60)
    for source, items in by_source.items():
        print(f"  {source}: {len(items)} redirects")
    print()


def main():
    results = audit_redirects()
    print_report(results)

    # Return exit code based on missing redirects
    missing = [r for r in results if r.status == "missing"]
    if missing:
        print(f"\n⚠️  Found {len(missing)} URLs without redirects!")
        return 1
    else:
        print("\n✓ All legacy URLs are covered!")
        return 0


if __name__ == "__main__":
    exit(main())
