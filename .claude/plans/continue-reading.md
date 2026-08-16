# Continue Reading — cross-site resume surface

Status: phase 0 + 1 implemented (2026-08-16), phases 2–4 open.

## Problem

The site already remembers where you were in a `/library/` book, but that
memory is invisible until you are already back on the book page. There is no
surface anywhere — homepage, navbar, burger menu — that says "you have three
things open, here they are." On mobile especially, getting back into a book
means remembering its name and navigating to it by hand.

The user-facing ask: an encircled count on the burger menu and its sub-items
showing how many open reading items exist, a way to jump back from the
landing page, and notes folded into the same idea.

## What already existed

| Capability | Where | Gap |
|---|---|---|
| Per-book resume | `woh_library_progress` → `library-reader.js` `resumeReadingPosition()` | Silent; only works once you are on the book page |
| Save for later | `woh-reading-list` → `reading-list.js` + slide-in panel | Manual saves only; unrelated to what you are actually mid-way through |
| Counter badge | `.reading-list-toggle__badge` in navbar + Read dropdown | Counts saved pages only |
| Verse-anchored notes | `woh_library_notes` → `library-study-tools.js` | UI ships in `library.bundle.js`; unreachable outside `/library/<book>/` |
| Reading history | `woh_library_history` | `lastRefId` always `1:1` (recorded at page load, before scroll tracking) |
| Audio position | — | Not persisted at all |

So the state existed and was already scattered across five localStorage keys.
What was missing is an aggregator and a place to show it.

## Design

### One aggregator, no storage migration

`continue-reading.js` (in `core.bundle.js`, therefore on every page) reads the
existing keys directly — it deliberately does **not** depend on
`LibraryStorage`, which only ships in `library.bundle.js`. It derives a single
"open items" model:

- **In progress** — from `woh_library_progress`, joined against
  `woh_library_history` for book titles. Sorted by `lastRead` desc, expired
  after `MAX_AGE_DAYS`.
- **Saved for later** — the existing `woh-reading-list`, untouched.
- **Notes** — most recently updated notes across all books, from
  `woh_library_notes`.

Book progress is language-agnostic by design (the slug is the same in every
locale), so deep links are built with the *current* locale prefix.

### Badge semantics

- **Burger toggle** (`[data-continue-badge]`) — total actionable open items
  (in progress + saved). This is the "you have things open" signal.
- **Bookmark button / Read-dropdown entry** (`.reading-list-toggle__badge`) —
  unchanged, still counts saved pages only, because both sit next to
  bookmark-specific labels.

Cap display at `9+`.

### One panel, not a new page

The existing reading-list slide-in panel becomes the **Continue panel** with
three groups: Continue reading / Saved for later / Recent notes. It keeps its
existing entry points (`[data-toggle-reading-list]`, `Shift+B`), so the
affordance is identical on every page, desktop and mobile.

`reading-list.js` still owns the panel; `continue-reading.js` mounts its
groups into `[data-continue-mount]` and owns the badges. The two communicate
through a `woh:reading-list-changed` document event and the
`window.ContinueReading` global. Bundle order matters:
`reading-list.js` **before** `continue-reading.js`.

## Phases

- **Phase 0 — storage fixes** (done)
  - `parseRefId` rejected real book codes: `/^[A-Za-z0-9]+-(\d+):(\d+)$/` does
    not match `GEN-WOH-1:1`, so notes in hyphenated-code books stored
    `chapter: null` and produced empty deep links. Same bug in
    `library-study-tools.js` `goToRef`.
  - `woh_library_history.lastRefId` was frozen at load-time position.
  - `removeHighlight` filtered on an `h.id` that `addHighlight` never wrote.
  - Progress records now also carry `bookTitle` and `lang` so the aggregator
    has titles without depending on history.
- **Phase 1 — aggregator, panel, badges** (done)
- **Phase 2 — site-wide long-form progress** (open): persist
  `{url, title, section, percent, anchor, updatedAt}` for articles, timeline
  chapters and wiki entries past ~5% scroll, drop past ~90%. The global
  `reading-progress.html` hairline already computes exactly this number and
  already detects exactly these page types.
- **Phase 3 — landing + `/read/` hub** (open): a single client-rendered
  "Continue: <title> · Ch. N →" chip in the landing hero (reserved slot,
  styled in critical CSS, populated after idle so the LCP protection in
  `index.html` is not compromised), and the full module on `/read/`.
- **Phase 4 — audio resume** (open): `woh_listen_progress` mirroring the
  library progress shape, so audiobook sessions become open items too.

## Constraints (learned from the codebase)

1. New global JS must be added to the `core.bundle.js` array in
   `themes/bifrost/scripts/bundle.js` and the dist bundle rebuilt
   (`npm run bundle`). The `static/js/dist/*.bundle.js` files are committed
   build artifacts.
2. PurgeCSS strips classes that only appear in JS strings. State classes must
   match the `SAFELIST` patterns in `scripts/purgecss.js` — `--visible` does.
3. Anything in the global chrome styled in `main.css` needs an entry in the
   `html:not(.css-loaded)` block of `critical.scss` or it flashes unstyled.
4. The navbar must stay transform-free — a transformed *ancestor* kills iOS
   `backdrop-filter` for the whole glass subtree. The badge is a descendant
   and uses plain absolute positioning, no transform.
5. New UI strings need keys in all 10 `[translations]` tables in
   `config.toml`, and RTL (`he`) needs the badge corner flipped in
   `sass/layout/_rtl.scss`.
