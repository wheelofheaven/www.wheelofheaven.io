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
  - **DIRTY (10 — count corrected 2026-08-06; serpent (8) was omitted
    from the first write-up): ALL TEN REPAIRED + DEPLOYED 2026-08-06**
    (content ff05729..28fa296, one commit per entry; www e3a4a98e9d3).
    De-slop-and-preserve via parallel agents + human verification:
    markers 131 → 1 (the survivor is a genuine Lévi-Straussian technical
    use in mytheme); every entry's description split into
    summary/tldr/keywords (150–160-char descriptions); citation/shortcode
    token counts verified identical; editorial_pass → 2026-08.
    **Phase 5 is COMPLETE.** Unambiguous factual fixes applied in passing
    (mahayuga arithmetic, Younger-Dryas dates, A1010 gloss, broken
    ancient-builders link, IAS naming, stale "(when written)" pointers,
    Eloha→Elohim teams, Greek/Latin roots, flood-millennia count, Caral
    interval).

### Flagged during the 2026-08 repair (needs editorial/source review, NOT fixed)

**Status 2026-08-06 — review batch applied (content `4fde255`, mytheme
earlier in `c3ed980`).** Mechanical + source-verified items FIXED:
great-flood see_also slashes; serpent footnote-3 "immediately" qualifier
+ infobox Isa 27:1 separated from the Eden line; sendys sequence
position ("fourth"→last, list reordered chronologically), Dyson
attribution corrected to "Interstellar Transport" (*Physics Today*,
1968; no 1964 SciAm article exists on this), Pali-vindication claims
rehedged (×2), stale 4,000+ exoplanet count; great-month Diogenes
360×→365× (report via Aëtius, not Censorinus), Gen 25:26 citation
dropped (Isaac was 60 — contradicted the 20–25-yr claim), fabricated
"72-day decan" and "Bardo 72" bullets cut (attested Bardo count is
42+58=100); biglino 17 *books* not 17 *years* (San Paolo "more than a
decade," ended c. 2010; the 1990–2007 range was invented), *La Bibbia
nuda* 2021 as first print (this ledger's own "2018" note was itself
wrong), San Paolo transliteration claim attributed to Biglino's
account; cosmic-pluralism πολυκοσμία/μονοκοσμία reworded as modern
coinages (not attested ancient vocabulary), *Burned Alive* → Reaktion
Books 2018, exoplanet count → 6,000+.
**ALL FLAGGED ITEMS NOW RESOLVED (2026-08, founder-ruled point-by-point):**
- great-month "c. 1950" vs 1945 → (c) NO edit; 1945 is the revelation-based
  Aquarius-entering claim, 1950 the lattice calculation, both stand; past-age
  dates kept as calculated.
- adamites 25,000-years vs Age-of-Leo + serpent Eden-disclosure dates →
  resolved by the **Model-C Eden chronology** decision (see
  [`model-c-chronology.md`](model-c-chronology.md)); adamites synthesis
  re-anchored to 11,375 BCE / opening of Leo, serpent disclosure to 8,850 BCE
  (Leo/Cancer boundary), and the whole two-stage model propagated across 14
  entries (content `c016084`, `2d858ce`, `77a4866`).
- tree-of-life Phase II window vs Genesis 1,656 → resolved by Model C
  (post-Eden grant now Age of Cancer 8,850–6,690, fits the 1,656-yr span).
- tree-of-life **Enoch** infobox-vs-body → (a) Enoch removed from the
  patriarchal-grant list, relocated to the extraction/Eternals category
  (matches the body's Gen 5:24 reading). `77a4866`.
- cosmic-pluralism claim_type `direct`→`framework`? → (b) KEEP `direct`
  (entry read as primarily a mainstream-doctrine survey). No edit.
- tree-of-life **quote 5** attribution → (a) attributed to *Extra-Terrestrials
  Took Me to Their Planet* (1975), Planet of the Eternals account (founder
  confirmed ETTMTTP is the source). `77a4866`.

Two NEW chronology residuals surfaced during Model-C propagation and are
deferred (see [`model-c-chronology.md`](model-c-chronology.md) "Flagged, NOT
fixed"): the Younger-Dryas placement in timeline age-of-cancer/age-of-gemini,
and the "~25,000 years ago for synthesis" phrasing in pantropy/precession/
great-year (inside the founder's "leave the 25,000 framing" boundary).
- great-month: Age of Aquarius "c. 1950" lattice vs timeline's 1945 start
  (entry-internal 2,160-lattice is self-consistent — reconciliation is an
  editorial decision); Diogenes-of-Babylon 360× vs attested 365×; Bardo
  "72 manifestations" count; Egyptian 72-day decan claim; Gen 25:26 as
  support for a 20–25-year generation.
- adamites: synthesis "25,000 years ago" vs Age-of-Leo window (~10ky gap).
- serpent: Eden-disclosure dates vs Leo/Cancer boundary arithmetic;
  infobox lists Isaiah 27:1 while body separates Leviathan's lineage;
  footnote 3 drops the "immediately" qualifier the body uses.
- tree-of-life: Phase II window vs Genesis's internal 1,656-year span;
  Enoch as grant-recipient (infobox) vs early extraction (body);
  unattributed 150–200-year lifespan claim; one block quote lacking
  book/chapter attribution.
- sendys-conditions: "fourth in sequence" vs six-item list; *The Coming
  of the Gods* = which French original; Dyson "1964 Scientific American"
  attribution; Pali-canon "vindication" claims stated in corpus voice
  (hedging review).
- biglino-method: 17-year vs 17-books conflation; "first appears in print
  2022" vs 2018 Italian original; unsourced San Paolo transliteration
  claim.
- cosmic-pluralism: πολυκοσμία/μονοκοσμία attestation dubious; *Burned
  Alive* publisher mismatch; exoplanet count staleness; claim_type
  arguably `framework` not `direct`.
- mytheme: Propp "initial situation" counted inside the 31 functions;
  J.Z. Smith encyclopedia article italicized as a book.
- great-flood: two library see_also paths lack leading slashes (cosmetic).
### Corpus-wide tail sweep (2026-08-06, after Phase 5)
A full-corpus recount immediately after Phase 5 showed the campaign's
tier lists had never covered the sub-8 tail: 38 files still carried
markers. Swept same day (content `40b94e2`): the 3–7 band (13 files —
prophet, dragons, pantropy, jesus, theomachy, cosmic-competition,
list-of-close-encounters, hebrew, apocalypse, terraforming,
list-of-exegetic-readings, life-engineering, elohim) carried the same
landscape-template filler in lighter concentration; the 1–2 trace band
was fixed where filler, kept where load-bearing. **The corpus floor is
now 8 documented-legitimate occurrences in 7 files** — method-vs-
substance contrasts (watchers, pangaea, ezekiel,
list-of-prophets-and-religions), grammatical uses (infinity ×2,
mytheme), and one frontmatter field label (crop-circles:
`substantive_residual_questions` infobox key, missed by the 6-file
count). Any `-ive` occurrence beyond these eight is suspect.
mytheme locales: agent-synced English metadata_only stub bodies
(`7384d07`) — content-safe, no translations existed.

- **Phase 4 — translations:** the corrupted entries × 9 languages still carry
  slop (≈144 files with the doubled marker; more on the `-ive` signal).
  Two lanes, by `translation_status`:
  1. **`metadata_only` stubs** (bodies are verbatim English): mechanical
     body-splice from the repaired English under the translated
     frontmatter — proven on mytheme ×9 (`7384d07`, byte-identity of the
     pre-repair body verified before splicing). Scriptable corpus-wide.
  2. **Genuinely translated entries**: re-fan via woh-fanout
     (translator → reviewer), not ad-hoc edits.

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
