# Sefaria-Inspired Source Platform Roadmap

**Created:** 2026-06-05
**Scope:** `www.wheelofheaven.world`, with dependencies in `data-library` and
`api.wheelofheaven.world`

## Strategic Assessment

Sefaria is useful to Wheel of Heaven less as a content model to copy and more
as a source-platform model.
Its strongest transferable pattern is product discipline around structured
texts: stable references, version-aware editions, topic graphs, reader-side
context, citation linking, public data surfaces, and explicit reuse metadata.

Wheel of Heaven already has the right architecture for this direction:

- `data-library` stores structured books, chapters, paragraphs, and refs.
- `www` exposes a capable library reader, wiki, sources, timeline, and hubs.
- `api` can publish static JSON data for agents, readers, and downstream tools.
- The source strategy already defines claim types, source tiers, stance, and
  relation-to-Wheel metadata.

The next step is to connect those pieces into a navigable evidence graph.

## GitHub Tracking

Issue trackers:

- [wheelofheaven/www.wheelofheaven.world#13](https://github.com/wheelofheaven/www.wheelofheaven.world/issues/13)
  — Wiki citations through source IDs + cited-by reverse index.
- [wheelofheaven/data-library#1](https://github.com/wheelofheaven/data-library/issues/1)
  — Add version, license, and provenance metadata to library texts.
- [wheelofheaven/www.wheelofheaven.world#20](https://github.com/wheelofheaven/www.wheelofheaven.world/issues/20)
  — Add a passage context panel to the Library reader.
- [wheelofheaven/www.wheelofheaven.world#21](https://github.com/wheelofheaven/www.wheelofheaven.world/issues/21)
  — Make concept and tradition hubs graph-backed instead of essay-only.
- [wheelofheaven/www.wheelofheaven.world#22](https://github.com/wheelofheaven/www.wheelofheaven.world/issues/22)
  — Prototype a Wheel of Heaven citation linker.
- [wheelofheaven/api.wheelofheaven.world#1](https://github.com/wheelofheaven/api.wheelofheaven.world/issues/1)
  — Polish the public API/data platform around schemas, refs, and dumps.

## Phase 1 — Make Citations Navigable

**Primary tracker:** `www#13`

Sefaria's first product lesson is that citations should be navigable data, not
only inline prose.
Wheel of Heaven already has this planned as the remaining sources-migration
work.

Deliverables:

- Decide the wiki/article frontmatter shape for structured source references.
- Validate cited source IDs at build time.
- Backfill high-priority wiki entries first.
- Generate a reverse `cited_by` index for source records.
- Render "Cited by" on source pages.

Acceptance criteria:

- Unknown source IDs fail validation.
- Source pages show which wiki/article pages use them.
- Future reader panels and hubs can reuse the same IDs.

## Phase 2 — Normalize Text Version Metadata

**Target repo:** `data-library`

Sefaria's version model is the important lesson here: reuse and trust live at
the version level, not only the work level.
Each text should make edition, translation, source, license, and provenance
machine-readable.

Proposed fields:

- `versionTitle`
- `versionLanguage`
- `sourceLanguage`
- `versionType`
- `translator`
- `editor`
- `reviewer`
- `baseText`
- `baseEdition`
- `sourceUrl`
- `sourceAccessedVia`
- `sourceAccessedAt`
- `licenseStatus`
- `licenseDetail`
- `licenseUrl`
- `jurisdictionNote`
- `sourceRecordId`
- `refSystem`

Deliverables:

- Audit current `_meta.json` shapes.
- Define and document the version/provenance schema.
- Backfill the schema on high-priority texts.
- Add validation for ambiguous license/provenance fields.
- Export the normalized fields into the API/catalog pipeline.

Acceptance criteria:

- A reader or API consumer can tell which version a passage comes from.
- License/reuse status is explicit at version level.
- Sefaria-derived and other external-source material remains license-auditable.

## Phase 3 — Add Passage Context To The Reader

**Target repo:** `www.wheelofheaven.world`

Wheel of Heaven's Library should make each passage a local evidence node.
Selecting a paragraph or verse should show the surrounding context without
forcing the reader out of the text.

Panel contents:

- Canonical ref and copyable citation.
- Work, chapter, paragraph/verse, and stable `refId`.
- Version and provenance metadata.
- Source/bibliography record link.
- Related concepts, traditions, and timeline nodes where mapped.
- Reverse `Cited by` links once Phase 1 ships.
- Claim/source-tier badges where relevant.
- Existing study tools: bookmark, highlight, note, progress.

Acceptance criteria:

- The panel works on desktop and mobile.
- It degrades cleanly when metadata has not been backfilled yet.
- Existing reader preferences, bookmarks, highlights, and search keep working.

## Phase 4 — Ship Graph-Backed Hubs

**Target repo:** `www.wheelofheaven.world`

The planned Elohim concept hub and Hebrew/Biblical tradition hub should be
structured graph nodes, not essay-only pages.
The hub schema should scale to later concept and tradition rollout.

Pilot hubs:

- `/explore/concept/elohim/`
- `/sources/tradition/hebrew/`

Each hub should expose:

- Summary and definition.
- Claim type and translation status.
- Source family, authority tier, relation to Wheel, and stance.
- Cited source IDs with build-time validation.
- Key source passages.
- Related concepts, traditions, timeline nodes, and library texts.
- Limits/challenges or critical-context section.
- Reverse links once available.

Acceptance criteria:

- The two pilots are useful both as landing pages and graph nodes.
- Missing or invalid source IDs fail validation.
- The schema can support future hub rollout without URL restructuring.

## Phase 5 — Prototype A Citation Linker

**Target repo:** `www.wheelofheaven.world`

Sefaria's automatic linker is directly relevant.
Wheel of Heaven should prototype a read-only linker that detects known reference
patterns and maps them to stable internal targets.

Initial patterns:

- `Genesis 1:26`
- `Gen.1.26`
- `Exodus 3:14`
- `TBWTT 1:51`
- `GEN-1:26`
- Existing `{% library(...) %}` shortcode refs
- Structured source IDs from Phase 1

Non-goals:

- Do not auto-rewrite all content blindly.
- Do not replace explicit editorial links.
- Do not create semantic claims from text matching alone.

Acceptance criteria:

- The scanner reports detected and unresolved refs.
- False positives are visible and manageable.
- The first pass is read-only.
- Output can feed later hover cards, reader panels, validation, or API exports.

## Phase 6 — Polish The Public Data Platform

**Target repo:** `api.wheelofheaven.world`

Wheel of Heaven's static API should feel like a public corpus surface, not just
the website's build artifact.
The API can remain static and CDN-cacheable while becoming much easier to use.

Deliverables:

- Endpoint inventory and schema examples.
- Reference-format documentation.
- Data dump manifest with timestamps or checksums.
- Version/license/provenance fields from `data-library`.
- Source IDs, cited sources, and reverse `cited_by` exports.
- Examples for fetching a passage, source record, citation graph, or search
  context.
- Clear reuse notes for CC0 project material versus version-specific source
  licenses.

Acceptance criteria:

- Developers can use the API without reading website source code.
- Stable refs and license boundaries are explicit in public data.
- API v1 remains additive and backwards compatible.

## Dependency Order

1. Structured source IDs and reverse citation index.
2. Version/license/provenance metadata.
3. Reader passage context panel.
4. Graph-backed hub pilots.
5. Citation linker prototype.
6. Public API/schema/data-dump polish.

The first two phases are the load-bearing data work.
The later phases should reuse those outputs rather than creating parallel
reference systems.

## Auth Note

On 2026-06-05, the GitHub app could read issues but returned `403 Resource not
accessible by integration` for issue creation/commenting.
Both `gh` and `gh-zarazinsfuss` were unauthenticated in this checkout.
Run `github-agent-login zarazinsfuss` before creating the planned issues.

On 2026-06-06, `github-agent-login zarazinsfuss` completed successfully and the
planned GitHub issues were created with `gh-zarazinsfuss`.
