#!/usr/bin/env python3
"""Regenerate static/.well-known/security.txt with a rolling expiry.

RFC 9116 makes `Expires` mandatory and wants it under a year out. A stale
security.txt is worse than none — it advertises a reporting channel that
may no longer be watched — so the date is refreshed by a scheduled job
(.github/workflows/security-txt.yml) rather than by anyone remembering.

Deliberately NOT wired into `mise run build`: this repo deploys via
Cloudflare Pages with a build command configured in the dashboard, which
is not readable from here, so a generation step in a local task might
simply never run in production. (That exact trap cost two commits on the
api repo, where scripts/postbuild.sh overwrites public/_headers and made
static/_headers look editable when it wasn't.) The workflow commits the
regenerated file to main, and Pages ships whatever is committed —
whatever its build command happens to be.

Run manually with:  python3 scripts/build_security_txt.py
"""

from __future__ import annotations

import datetime as dt
import pathlib
import sys

# How far ahead to set Expires. RFC 9116 §2.5.5 says the value should be
# less than a year out; the workflow re-runs monthly, so in practice the
# published file always sits ~1 year ahead and never drifts close to
# expiry between runs.
VALID_FOR = dt.timedelta(days=365)

OUT = pathlib.Path(__file__).resolve().parent.parent / "static" / ".well-known" / "security.txt"

TEMPLATE = """\
# Security contact for the Wheel of Heaven project — RFC 9116.
#
# GENERATED FILE — do not edit by hand. The Expires field is refreshed by
# .github/workflows/security-txt.yml; edit scripts/build_security_txt.py
# instead. See https://github.com/wheelofheaven/.github/blob/main/SECURITY.md
#
# Private vulnerability reporting on GitHub is preferred: it keeps the
# report private until a fix ships, and means no address has to sit here
# in plain text waiting to be harvested. The contact page is the fallback
# for anyone who cannot use that form.

Contact: https://github.com/wheelofheaven/www.wheelofheaven.world/security/advisories/new
Contact: https://www.wheelofheaven.world/contact/
Expires: {expires}
Policy: https://github.com/wheelofheaven/.github/blob/main/SECURITY.md
Preferred-Languages: en
Canonical: https://www.wheelofheaven.world/.well-known/security.txt
"""


def render(now: dt.datetime) -> str:
    # RFC 9116 wants an ISO 8601 / RFC 3339 timestamp. Zulu form, seconds
    # precision, no microseconds — the format every parser agrees on.
    expires = (now + VALID_FOR).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    return TEMPLATE.format(expires=expires)


def main() -> int:
    body = render(dt.datetime.now(dt.timezone.utc))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    previous = OUT.read_text(encoding="utf-8") if OUT.exists() else ""
    if previous == body:
        print(f"security.txt already current: {OUT}")
        return 0
    OUT.write_text(body, encoding="utf-8")
    print(f"wrote {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
