# Wiki Decontamination — Triage Plan

**Status:** proposed (awaiting go)
**Owner:** editorial
**Created under:** 2026-07 incident review

## 1. The problem

A May 2026 "curation" campaign — commits `adf3dea` (Abraham+Noah cluster,
2026-05-12), `eb8b956`, `b0e0067` under `zarazinsfuss` — inflated clean but thin
wiki stubs into 8k–15k-word entries saturated with generated filler
("substantive substantial", lone "substantial"/"substantive", and the same
telegraphic slop register: *"leader of a operational team… registered in the
timeline.epub engagement"*).

- **Scope:** ~101 of 138 English wiki entries carry filler; **86 are heavily
  corrupted** (>20 occurrences). Across 9 languages ≈ 900 files nominally, but
  translations are far less affected (16 per language carry "substantive
  substantial") — they likely predate the campaign and may be *cleaner* than
  the current English.
- **Baseline:** commit `52a1876` (2026-05-12, parent of the campaign) has **0**
  filler site-wide. It is a clean snapshot, but its versions are thin stubs and
  predate later legitimate work (see_also/wikilink/library backfills, new entries).
- **Stripping is insufficient (proven):** removing all filler from `noah.md`
  leaves 9,331 words of grammatically-rough slop. The prose underneath is
  generated, not good text with filler sprinkled in.

## 2. Disposition rule

For each corrupted entry, exactly one disposition:

| Disposition | When | Result |
|---|---|---|
| **REWRITE** | Core-canon entry, OR no clean baseline (`words_base = 0`), OR baseline stub too thin to stand | Proper entry written to editorial standard (six-source discipline) |
| **RESTORE→stub** | Peripheral entry with a usable clean baseline (`words_base` ≳ 400) | Revert body to `52a1876` version; re-apply post-campaign see_also/wikilinks; clean but thin, queued for later rewrite |
| **REVIEW** | Baseline is a micro-stub (`words_base` < 400) or ambiguous | Decide case-by-case at execution time |

**No blanket restore** — reverting the whole wiki to `52a1876` would also drop
2.5 months of legitimate work and every entry created since. Dispositions are
per-entry.

## 3. Phased sequence

### Phase 0 — Emergency clean (optional, fast)
RESTORE→stub the most-bloated peripheral entries that have clean baselines, so
the worst live pages become honest (if thin) immediately. Candidates: `noah`*,
`number-of-man`, `forerunners`, `golden-age`, `paradism`, `new-commandments`,
`samsara`, `noahic-covenant`. (*`noah` is core — see Phase 1.)
Each: `git show 52a1876:wiki/X.md` → body, re-apply current frontmatter +
see_also, build-verify, deploy in one batch.

### Phase 1 — Core-canon rewrites (highest value)
Full rewrites, one entry at a time, each build-verified and reviewed:
`noah`, `abraham`†, `jesus`, `satan`†, `lucifer`†, `adam-and-eve`, `serpent`,
`council-of-eternals`, `intelligent-design`, `rael`‡, `embassy`‡,
`plurality-of-gods`†, `ancient-astronaut-hypothesis`, `theomachy`‡,
`great-flood`, `hebrew-bible`‡, `prophet`, `apocalypse`.
(† body still corrupted even after today's see_also re-link. ‡ born corrupted,
no baseline — rewrite is the only option.)

### Phase 2 — Supporting entries
`noahs-ark`, `sodom-and-gomorrah`, `tree-of-life`,
`tree-of-the-knowledge-of-good-and-evil`, `babel`‡, `antediluvian`, `raelism`,
`biglino-method`, `hebrew`, `precession`, `great-year`, `world-age`,
`cosmic-chain`‡, `cosmic-competition`‡, `doubled-signature`‡, `living-earth`‡,
`elohim-home-planet`‡, `four-levels`‡, `wheel-of-heaven`, `third-temple`,
`kabbalah`, `star-of-david`, `swastika`, `dragons`, `zodiac`.

### Phase 3 — Peripheral long tail (RESTORE→stub, rewrite as capacity allows)
Remaining ~40 entries (concept/science/symbol entries: `astrobiology`,
`drake-equation`, `crop-circles`, `sacred-geometry`, `ufology`,
`genetic-engineering`, `neo-euhemerism`, `mass-effect`, `terraforming`,
`pantropy`, `synthetic-genomics`, `cyberparadism`, `paradism`, `geniocracy`,
`humanitarianism`, `the-truth`, `the-tradition`, `mytheme`,
`comparative-mythology`, `archaeoastronomy`, `military-cover-up-of-exobiology`,
`us-space-force`, `new-jerusalem`, `ancient-builders`, `infinity`,
`raelian-symbol-of-infinity`, `great-return`, `great-month`, `adamites`,
`cosmic-pluralism`, `sendys-conditions-of-coherence`, `list-of-close-encounters`,
`list-of-megalithic-sites`, `religion`, `number-of-man`, `forerunners`,
`golden-age`, `new-commandments`, `samsara`, `noahic-covenant`,
`the-alliance`‡, `fractal-cosmology`‡, `mass-effect`).

### Phase 4 — Translations
For every fixed English entry, re-fan to the 9 languages via the woh-fanout
pipeline. First verify whether existing translations predate the corruption
(cleaner) and could seed the re-fan. The 16 "substantive substantial"
translation files per language are the priority within this phase.

## 4. Execution notes
- One entry (or one small batch) per commit, explicit paths, build-verify before
  each deploy — same discipline as today's monotheism fix.
- `elohim`, `yahweh`, `genesis` are **NOT** corrupted (≤20 filler) — leave them.
- Track progress by checking `grep -c "substantive\|substantial"` down to the
  legitimate-usage floor per entry.

## 5. Full inventory
(filler = substantial|substantive occurrences; base = word count at clean
baseline 52a1876; `base=0` ⇒ born corrupted, rewrite-only)

See attached table in the session (86 entries, sorted by severity).
