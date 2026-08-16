# Continue Reading — cross-site resume surface

Status: phases 0–4 implemented (2026-08-16). Verified against a full
`zola build` plus a headless-Chrome pass over the real templates.

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
- **Phase 2 — site-wide long-form progress** (done): `page-progress.js`
  persists `{path, title, section, percent, anchor, lang, updatedAt}` to
  `woh_page_progress` for `/wiki/`, `/articles/`, `/timeline/` and `/news/`
  leaf pages past 5%, and deletes the record past 90%. Keyed by the
  locale-stripped path, so the same entry read in two languages is one item.
  - It runs **no scroll loop of its own**: `reading-progress.html` emits
    `woh:reading-progress` with the position it already computes.
  - That partial had to be fixed first. base.html includes it at the top of
    `<body>`, so its content-selector queries ran before `<main>` was parsed,
    always missed, and hid the hairline on **every page of the site**. It now
    waits for `DOMContentLoaded`.
  - The event carries `contentPercent` (progress through the article element)
    alongside the document-scroll `percent` the bar draws. The footer is tall
    enough that a fully-read short entry never nears 100% of the document,
    which would pin finished pages in the panel forever.
  - Section index pages are excluded — only leaf entries are things you are
    part-way through. `/sources/` and `/datasets/` are excluded too: they are
    consulted, not read start-to-finish.
- **Phase 3 — landing + `/read/` hub** (done): `[data-continue-chip]` in
  landing §1 and `[data-continue-module]` at the top of `/read/`. Both are
  empty in the HTML and `display: none` until JS finds something, so a
  first-time reader's layout is unchanged; the chip additionally waits for
  `requestIdleCallback` so it never competes with the hero LCP.
  - Desktop also gained its own panel toggle, `.navbar__reading-btn`, beside
    the search button. The badge could not go on the Read split-button: that
    element sets `overflow: hidden` and would clip a corner badge, and it is
    a `backdrop-filter` glass surface. The new button reuses
    `[data-toggle-reading-list]`, so reading-list.js needed no new wiring —
    and the panel is now one click away on desktop instead of two.
- **Phase 4 — audio resume** (done): `listen-button.js` writes
  `woh_listen_progress` off the central `onProgress` (prerecorded engine, real
  seconds) and `onUnitStart` (studio/system engines, unit boundaries),
  throttled to one write per 5 s, flushed on pause / `pagehide` /
  `visibilitychange`, and cleared at 97% or on `onEnd`. Rendered as a separate
  "Continue listening" group.

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
6. **core.bundle.js is deferred, so `document.readyState` is already past
   `loading` when it executes.** Every module in it therefore takes the
   `else { init(); }` branch and initializes *synchronously, in bundle
   order*, during its own evaluation — a later module's globals do not
   exist yet. This bit phase 1: reading-list.js decided the panel's empty
   state from `window.ContinueReading?.getOpenItemCount()`, which was
   `undefined` at that moment, so "Nothing open yet" rendered on top of a
   populated panel. Fixed by exposing `ReadingList.refreshPanel` and having
   continue-reading.js call it once initialized. Any future cross-module
   read at init time needs the same treatment — optional chaining hides
   this failure instead of surfacing it.
7. Relative times use `Intl.RelativeTimeFormat` against
   `document.documentElement.lang` rather than translated strings — four
   more keys across ten locale tables buys nothing Intl doesn't already do
   correctly.

## Verification

`scripts/` has no test runner for browser JS, so this shipped behind a
headless-Chrome pass driven over CDP against `zola serve` (the driver
scripts are scratch, not committed). What it covered: the hairline is no
longer `display: none`; scrolling writes `woh_page_progress` with a real
title/section/percent/anchor; the badge counts the item from another page;
the current page is excluded from its own count; the panel, landing chip and
`/read/` module all render; reaching the end of a page clears the record;
the empty state is panel-wide; the desktop toggle opens the panel; the
listening group renders and its items dismiss; the mobile viewport shows the
burger badge and hides the desktop toggle; RTL pins the badge to the
left corner (verified positionally — `getComputedStyle` resolves
`right: auto` to a used value, so asserting on the string fails).
