# Wiki Decontamination — Triage Plan

**Status:** 48 English entries decontaminated + deployed. Two more phases
remain (below). Scope grew across passes as the detection signal was
sharpened — see "Detection lesson."
**Owner:** editorial
**Created under:** 2026-07 incident review

## Detection lesson (important)
The reliable slop signal is the **`-ive` family: `substantive` + `substantively`**,
counted per entry (not per-1000-words). Earlier metrics under-counted:
1. `"substantive substantial"` (doubled phrase) → only caught 16 entries.
2. density of `substantial|substantive` per 1000 words → caught 41, but
   `substantial` is common legit English, so it both over-counted (flagged
   clean entries like great-flood/kabbalah) AND under-counted long entries
   with lighter `-ive` slop (missed great-return, world-age, etc.).
3. lone `substantive`+`substantively` count → the clean signal. Anything ≥~8
   is slopped; the tail (5–8) needs a per-file eyeball.

## Remaining work
- **Phase 5 — light-band entries (20):** lone `-ive` count 8–23, deferred by
  editorial call (do the 7 heavy first). De-slop-and-preserve (mostly real
  content): `sendys-conditions-of-coherence`, `lucifer`, `precession`,
  ~~`council-of-eternals`~~, `satan`, `cosmic-pluralism`, `cosmic-chain`,
  `tree-of-life`, `great-month`, `the-alliance`, `infinity`, `great-flood`,
  `raelism`, `embassy`, `biglino-method`, `mytheme`, `doubled-signature`,
  `list-of-megalithic-sites`, `adamites`, `serpent`.
  **Full Phase-5 audit (2026-08-06)** — every entry measured for
  `editorial_pass` + lone `-ive` count. The list was badly stale: the
  2026-07 pass had already rewritten over half of it.
  - **CLEAN (11, no work needed):** council-of-eternals, lucifer,
    precession, satan, cosmic-chain, the-alliance, embassy,
    doubled-signature (all 2026-07, 0 `-ive`); infinity + raelism
    (2026-07, 1–2 `-ive` — eyeballed, legitimate grammatical uses).
  - **DIRTY (9, true remaining Phase-5 worklist, by `-ive` count):**
    sendys-conditions-of-coherence (22), cosmic-pluralism (17),
    tree-of-life (15), great-month (15), great-flood (14),
    biglino-method (12), mytheme (10), list-of-megalithic-sites (9),
    adamites (9) — all still on the 2026-05 pass, 5.9k–12.9k words.
    Note great-flood: clean of the *doubled* marker (per §4) but firmly
    in the light `-ive` band; the §4 "leave them" note applies to the
    doubled-marker campaign only.
- **Phase 4 — translations:** the corrupted entries × 9 languages still carry
  slop (≈144 files with the doubled marker; more on the `-ive` signal).
  Re-fan from the now-clean English via woh-fanout.

## Deploy record (content main → www main)
- noah `ca5a056`, abraham `61ab8c2` (individual, with monotheism re-link)
- Tier A (16): content `254e06e` → www `0c268081bdd`
- Tier B (14): content `30ae858` → www `96dfb4be6ea`
- Tier C (9): content `0cd1042` → www `c6af3c96064`
- Tier D (7 heavy residual `-ive`): content `483cb2e` → www `a078014d80f`

## Known follow-ups (not part of the slop campaign)
- ~~Site-wide dead link: `council-of-the-eternals` should be `council-of-eternals`~~
  **RESOLVED the other way (verified 2026-08-06):** the entry's canonical
  slug is now `council-of-the-eternals` (set in frontmatter, file still
  named `council-of-eternals.md`) with an alias from the short form — the
  69 EN files referencing the long slug are live links, not dead ones.
  Nothing to sed.
- A handful of entries reference not-yet-created pages (forward references:
  john-the-baptist, bab, bahaullah, joseph-smith) — non-breaking.

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
