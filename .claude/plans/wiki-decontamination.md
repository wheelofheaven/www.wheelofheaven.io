# Wiki Decontamination — Triage Plan

**Status:** in progress (2 of 16 English entries done)
**Owner:** editorial
**Created under:** 2026-07 incident review

## 1. The problem

A May 2026 "curation" campaign — commits `adf3dea` (Abraham+Noah cluster,
2026-05-12), `eb8b956`, `b0e0067` under `zarazinsfuss` — inflated clean but thin
wiki stubs into 8k–15k-word entries saturated with generated filler: the
doubled phrase **"substantive substantial"** plus a telegraphic slop register
(*"leader of a operational team… registered in the timeline.epub engagement"*).

### Scope (corrected 2026-07)

The reliable corruption marker is the **doubled phrase `substantive
substantial`**, which is *never* legitimate. Ranking by lone
`substantial`/`substantive` badly over-counts — those are normal English (e.g.
`great-flood` and `kabbalah` have 100+ lone hits but are clean, well-cited
prose). Using the doubled marker, the genuinely corrupted set is **16 English
entries**, not ~101:

| Entry | `substantive substantial` | Disposition |
|---|---:|---|
| `noah` | (was 791) | ✅ **rewritten + deployed** |
| `abraham` | (was 821) | ✅ **rewritten + deployed** |
| `forerunners` | 900 | rewrite |
| `number-of-man` | 845 | rewrite |
| `ancient-astronaut-hypothesis` | 815 | rewrite (core) |
| `noahic-covenant` | 786 | rewrite (core) |
| `tree-of-the-knowledge-of-good-and-evil` | 726 | rewrite (core) |
| `paradism` | 624 | rewrite |
| `noahs-ark` | 612 | rewrite (core) |
| `samsara` | 586 | rewrite |
| `new-commandments` | 487 | rewrite |
| `golden-age` | 199 | rewrite |
| `new-jerusalem` | 92 | rewrite |
| `geniocracy` | 57 | rewrite |
| `us-space-force` | 2 | **strip only** (light) |
| `humanitarianism` | 2 | **strip only** (light) |

Translations: the same 16 entries carry the marker in each of the 9 languages
(≈ 144 translation files). Other translations predate the campaign and are
clean.

## 2. Method (proven on noah + abraham)

Stripping the filler alone is **insufficient** — the underlying prose is
generated slop, not good text with filler sprinkled in. The working method:

1. **Preserve** the clean scaffolding — frontmatter, infobox, structured/`##`
   references, and any clean sections (e.g. abraham's etymology and Hanafiyya
   sections were untouched). Check each with
   `grep -c "substantive substantial"` per section.
2. **Rewrite** the slop body to editorial standard: opening definition →
   etymology → primary-text narrative → the Wheel of Heaven reading →
   comparative → scholarly/critical → see also. Canon claims direct;
   comparative/scientific/critical claims hedged; `inferred`/`speculative`
   labelled honestly.
3. **Fix canon errors** found in passing (noah: the ark-preservation faction is
   exiled Lucifer, not Satan — per `great-flood.md`).
4. **Build-verify** (`zola build`, expect 0 errors) before deploy.
5. **Deploy** surgically: one entry per content commit (explicit path) →
   push content main → bump www `content` pointer → push www main. Each entry
   is independently reversible.
6. Target ~2,400–3,200 words of real content (down from 10k–12k of slop).

## 3. Sequence

- **Phase 1 — core-canon corrupted:** `noah` ✅, `abraham` ✅,
  `ancient-astronaut-hypothesis`, `noahic-covenant`,
  `tree-of-the-knowledge-of-good-and-evil`, `noahs-ark`.
- **Phase 2 — peripheral corrupted:** `forerunners`, `number-of-man`,
  `paradism`, `samsara`, `new-commandments`, `golden-age`, `new-jerusalem`,
  `geniocracy`.
- **Phase 3 — light strips:** `us-space-force`, `humanitarianism` (2 filler
  instances each; strip, don't rewrite).
- **Phase 4 — translations:** re-fan each fixed English entry to the 9
  languages (woh-fanout), or verify the pre-campaign translation is clean and
  reinstate it.

## 4. Notes
- `elohim`, `yahweh`, `genesis`, `great-flood`, `kabbalah` and the rest of the
  wiki are **not** corrupted — leave them.
- Watch for a stray entry corrupted with a different slop pattern and no doubled
  phrase; spot-checks (`great-flood`, `kabbalah`) came back clean, so the marker
  is reliable, but sample as the campaign proceeds.
- Pre-campaign baseline for reference/restore: commit `52a1876`.
