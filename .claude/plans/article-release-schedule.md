# Article release schedule

Seven finished `/articles/` Explainers were written between June and July 2026
and sat unpublished. They are being released on a **fortnightly** cadence
rather than all at once, so each piece gets its own moment and the Telegram
broadcast channel isn't flooded.

## How this runs

**There is no automation.** No cron, no scheduled workflow, no cloud routine.
Each release is run by hand, one per working session, when the maintainer asks
for it. This file is therefore the *only* durable record of the schedule —
if it isn't written here, it isn't scheduled.

Each release is a full [`woh-article-publish`](../skills/woh-article-publish/SKILL.md)
run: de-slop, frontmatter, six-source audit, claim binding, reciprocal wiki
cross-links, publish, nine-language fan-out, OG cards, three surgical commits.

Publishing pushes `www` `main`, which triggers `broadcast.yml` — so **each
release posts exactly one article to Telegram.** That is the whole reason for
the stagger.

## Queue

| # | Target | Article | Words | Claim type | Binds | Status |
|---|---|---|---|---|---|---|
| 1 | 2026-09-01 | The Signature and the Designers | 7,834 | speculative | 0036, 0030 | **published** — live in 10 langs, Telegram 51 |
| 2 | 2026-09-15 | Six Mornings, Six Years | 6,725 | inferred | 0035 | queued |
| 3 | 2026-09-29 | Made from the Ground to Bear the Labor | 4,796 | inferred | 0034 | queued |
| 4 | 2026-10-13 | The Filing Cabinet of the Gods | 7,394 | speculative | 0056 | queued |
| 5 | 2026-10-27 | The Forty Chairs | 10,162 | inferred | 0054 | queued |
| 6 | 2026-11-10 | The Jubilee and the Machine | 7,178 | inferred | 0055 | queued |
| 7 | 2026-11-24 | The Reporter at the Razor's Edge | 7,137 | inferred | 0057 | queued |

Dates are targets, not commitments — the cadence is what matters, not the
calendar. Slipping a fortnight is fine; publishing two in one week defeats the
point.

### Why this order

2 and 3 come first because they are about the corpus's own foundations — how
the canon was transmitted, and the oldest creation texts it reads. 4 and 5 are
the two methodological pieces (what a motif index can show; how to decide which
traditions the corpus recognizes), and they sit in the middle where they can
lean on what came before. 6 and 7 look outward — economics and contemporary
national-security reporting — and close the run.

The order is editorial preference, not dependency. Any of 2–7 can be moved.

## Not in the queue

**As Foolish to Search for the Beginning** — 1,110 words across eight headings,
and its own summary opens `SCAFFOLD — broad strokes only, to be written out
later in 2026.` It is the temporal companion to *The Infinite in Both
Directions* and needs writing before it needs publishing.

## Before each release

- Confirm the target article is still `draft = true` and untouched by other
  sessions.
- Check for concurrent translation WIP before fanning out — a parallel session
  has collided with a fan-out before.
- The claim binding must match the record's current `version` exactly, or
  `core/scripts/validate.py` fails `publication_integration`.

## Known state to carry forward

- `data/sources.json` holds stale `cited_by` rows pointing at these articles'
  URLs while they are still drafts. They do not surface publicly (the builder
  skips drafts on every rebuild) and they become correct on publication.
- The seven articles cite many works by annotated inline title rather than by
  stable id, which mints slugified source records. This is corpus-wide and
  predates them; see the bibliography pipeline notes. Not a release blocker.

## Open defects found during release 1 (not blockers)

**`lets-welcome-the-extraterrestrials` chapter 1 — French/English misalignment.**
Within a single paragraph record, `text` (French) and `i18n.en` are different
passages. Confirmed at two points, both +8:

- French ¶89 holds the French of the sentence whose English sits at ¶97
  ("The Elohim created us, and other people from another planet created them").
- French ¶94 holds the French of the sentence whose English sits at ¶103
  ("It is as foolish to search for the beginning of the universe in time…").

Present identically in `data-library/` and in www's `data/library/` copy.

Consequence: the English article cites `verse=97` / `verse=103`, which are
correct *against the English*. The French page quotes the correct French prose
but its "Lire dans" deep-links (`#c1p97`, `#c1p103`) land on paragraphs that do
not contain the quoted sentence. Which side is authoritative is an editorial
question — the book's original language is French, so the French numbering is
probably the true one and the English is shifted.

**Scope is NOT established.** A length-ratio heuristic over all 201 paragraphs
was too noisy to locate where the drift starts or ends (estimates scattered
from -13 to +14). Determining the extent needs a real aligner or a human read
of the chapter. Do not "fix" it by editing verse arguments in article files —
that bakes the defect into content.

**Other things worth a corpus-wide decision** (surfaced by the translators, all
pre-existing):

- German is split on `Yahweh` (8 articles) vs `Jahwe` (5). This article uses
  `Yahweh`; the companion it explicitly hands off to uses `Jahwe`.
- French glossary says `Dessein Intelligent` for intelligent-design, but
  `content/fr/wiki/intelligent-design.md` is titled `Conception intelligente`.
- `council-of-the-eternals` is **not broken in any language** — settled, do not
  "fix" it. Four separate translator agents reported it as a dangling slug that
  "fails silently", one citing project memory as backing, one recommending the
  English source be changed and all nine locales re-fanned. All four were doing
  a filename-existence check. The facts: `wiki/council-of-eternals.md` sets
  `slug = "council-of-the-eternals"` in frontmatter (plus an alias for the short
  path), **all nine translated copies set the same slug override**, and the live
  site returns 200 for both `/wiki/council-of-the-eternals/` and
  `/wiki/council-of-eternals/`. The shortcode builds its href from the slug
  string via `get_url` and never looks up a page, so it cannot "fail silently"
  — it always emits a link, and that link resolves. Acting on this report once
  before produced a bad fix reverted across ten files.
