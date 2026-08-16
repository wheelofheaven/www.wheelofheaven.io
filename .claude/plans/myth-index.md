# Myth Index — comparative motif spine + official tale-type layer

Status: planned (2026-08-16). Scout complete, schema drafted, nothing built.
Goal: recognition quick-win for the dataset distribution surface (HF + Kaggle
+ api + www landing pages — the 4-surface playbook from the existing 6
datasets).

## The idea

Two new datasets, published as a pair:

1. **`myth-index`** — the WoH derivative. A cross-cultural motif × tradition
   spine that unifies and extends the three existing comparative datasets
   (flood-myths, divine-council-index, theomachy-crossrefs), with scholarly
   crosswalk columns (Thompson motif numbers, ATU/Aarne type numbers) and a
   clearly-separated canon-reading column. CC0, own work.
2. **`aarne-1910-tale-types`** — "the official one." A faithful structured
   digitization of Antti Aarne's *Verzeichnis der Märchentypen* (FFC 3,
   Helsinki 1910), the origin of the Aarne–Thompson–Uther system. Public
   domain worldwide; structured dataset released CC0.

Same two-layer pattern as the translation corpora (reference translation as
control + WoH layer as value-add), applied to classification data.

## Scout findings (2026-08-16)

### Existing structured versions — what NOT to rebuild

| Object | Covers | License | Verdict |
|---|---|---|---|
| [KatjaMellmann/TMI_as_CSV](https://github.com/KatjaMellmann/TMI_as_CSV) | Thompson Motif-Index **1955–58** (copyrighted ed.) | CC-BY-4.0 | TMI exists — cite, don't re-digitize |
| [fbkarsdorp/tmi](https://github.com/fbkarsdorp/tmi) (MOMFER parse) | TMI, edition undeclared | Apache-2.0 | same |
| [j-hagedorn/trilogy](https://github.com/j-hagedorn/trilogy) | TMI + ATU types + annotated tales | **CC-BY-SA 4.0** | most comprehensive, but share-alike is viral — never embed into a CC0 dataset; join by number only |
| [Aragoner/folkmotif](https://huggingface.co/datasets/Aragoner/folkmotif) (HF) | 27 TMI roles × 10 traditions | — | adjacent in spirit, small; not an index digitization |

Pattern: everyone structured the **copyrighted** editions and put open
licenses on top ("permissions granted" hand-wave or silence). **Nobody has
published a provenance-clean structured index.** That's the gap.

### PD sources

- **Aarne 1910** (*Verzeichnis der Märchentypen*, FFC 3): PD **worldwide**
  (Aarne d. 1925). Full transcription on
  [German Wikisource](https://de.wikisource.org/wiki/Verzeichnis_der_M%C3%A4rchentypen),
  Bearbeitungsstand **fertig**, proofread twice. Verified complete to type
  1960 + closing TOC (2026-08-16). Page 64 (`Seite:FFC3.djvu/76`) is
  `pagequality level=0` (blank in the original) — commented out of the
  transclusion, nothing missing. **No OCR needed — this is a parsing job.**
- **AT 1928** (*The Types of the Folk-Tale*, FFC 74, Thompson's English
  revision): PD **US only** (Wikisource flags it still copyrighted in
  Finland; Thompson d. 1976 → life+70 runs to 2047).
  [Scan on archive.org](https://archive.org/details/typesoffolktalec0000aarn)
  + [PDF on en.wikisource](https://en.wikisource.org/wiki/File:Antti_Aarne_and_Stith_Thompson_-_The_Types_of_the_Folk-Tale_(1928).pdf)
  with only ~31/291 pages transcribed → real OCR job (ingest-pipeline scale).
  **Deferred** — optional follow-up, honestly labeled `PD-US-only`.

### Honesty note on the join

Aarne/ATU indexes **folktales** (Märchen); the Myth Index families are mostly
**myth**, which the scholarly apparatus covers via the Thompson Motif-Index
A-section (A1010 Deluge, etc.), not tale types. So:

- `thompson_motifs` is the **primary** crosswalk column (numbers + short
  labels are citable facts; full-index lookups cite TMI_as_CSV / MOMFER);
- `atu_type` / `aarne_1910_type` will be **sparse** on myth rows.

The pair is a *collection* story ("official classification layer + WoH
comparative layer"), not a tight foreign-key join. Don't oversell the join on
the dataset cards.

## `myth-index` v1 schema

Spine table. Family-specific depth (survivor/vessel/council_term/weapon…)
**stays in the specialized datasets**, linked by id — do not flatten it in.

| column | notes |
|---|---|
| `id` | `{family}-{attestation}`, continuing existing id style: `flood-sumerian-ziusudra` |
| `motif_family` | controlled vocab, see below |
| `tradition` | same vocabulary as existing datasets ("Sumerian", "Ugaritic (Canaanite)", …) |
| `source_text` | named primary text |
| `reference` | locator (tablet/chapter/verse). **Backfill needed:** flood-myths rows have `approx_date` but no locator — add 11 locators (Gilg XI etc.) |
| `summary` | 1–3 sentences, own CC0 prose describing the attestation |
| `thompson_motifs` | list of TMI numbers, e.g. `["A1010"]` — primary crosswalk |
| `atu_type` | sparse; only where a genuine tale type exists |
| `aarne_1910_type` | sparse; join key into our own official dataset |
| `woh_wiki` / `woh_library` | site URLs (existing convention) |
| `see_dataset` | slug of the specialized WoH dataset with full depth (`flood-myths`, `divine-council-index`, `theomachy-crossrefs`), empty otherwise |
| `woh_reading` | optional one-sentence canon angle — the explicitly-labeled WoH interpretive layer, kept separate from source description (claim discipline) |

### v1 motif families

Import as-is (36 rows): `flood` (11), `divine-council` (17), `theomachy` (8).

New families (candidates — verify each row to the v1.1 depth standard: named
primary text + locator):

| family | ~rows | candidate attestations |
|---|---|---|
| `creation-of-humans` | 8 | Gen 1–2; Atrahasis I (clay + blood of slain god); Enūma Eliš VI; Prometheus (Apollodorus 1.7.1 / Ovid Met. 1); Popol Vuh maize; Khnum's potter's wheel; Nüwa (Fengsu Tongyi); Ask & Embla (Völuspá 17–18) |
| `sky-descent` | 7 | Watchers (1 Enoch 6–8); apkallu/Oannes (Berossos); Prometheus' fire; Viracocha; Kumarbi cycle?; Dogon Nommo (careful — Griaule contested, may drop) |
| `tower-babel` | 5 | Gen 11; Jubilees 10; Etemenanki tradition; Cholula pyramid (Durán); Aloadae piling Ossa on Pelion (Od. 11.305ff) |
| `giants` | 7 | Nephilim (Gen 6:1–4); Anakim; 1 Enoch giants; Titans/Gigantes (Theogony); Jötnar; Gilgamesh as 2/3-divine king?; Og of Bashan (Deut 3:11) |
| `garden-paradise` | 6 | Eden (Gen 2); Dilmun (Enki and Ninhursag); Hesperides; Elysium; Yima's vara (Vendidad 2 — ties to library vendidad-woh plans); Peaches of Xiwangmu |
| `immortality-quest` | 6 | Gilgamesh's plant (Gilg XI); Adapa; Utnapishtim's grant; Idunn's apples; ambrosia; elixir of Xiwangmu |

Target ≈ 70–80 rows total for v1 — citable size, one research campaign.
Rows are source-descriptions (dataset-level `claim_type = "direct"` per the
resource convention); the canon layer lives only in `woh_reading`.

## `aarne-1910-tale-types` build

**Source:** de.wikisource `Seite:FFC3.djvu/1–78` raw wikitext (`?action=raw`
per page), transcluded by the main page. ~66 printed pages, ~522 type
entries, numbering 1–1960 with deliberate gaps + lettered subtypes (130 C
etc.).

**Wikitext shape (verified on djvu/20):** each type is a table row —

```
| align="right" valign="top" | '''155.''' || {{SperrSchrift|Undank ist der Welt Lohn}}: der Mann befreit … (Gg No. 76).
```

- number in `'''N.'''`, title in `{{SperrSchrift|…}}`, description after the
  colon, cross-refs `(Gg No. X)` = Grundtvig, `(Grimm No. X)` = KHM
- section headings via `{{LineCenterSize|…|'''Heading'''}}`; part structure
  I. Tiermärchen / II. Eigentliche Märchen / III. Schwänke (verify exact
  ranges from the closing TOC)
- edge case: entries continue across page boundaries (`<section begin=t />`
  continuation text) — parser must stitch rows

**Columns:** `type` (int), `subtype` (letter, nullable), `title_de`,
`description_de`, `part` / `subsection` (de), `grundtvig_no`, `grimm_no`,
`page`, `title_en` (own CC0 English gloss — the differentiator that makes it
usable to non-German folklorists), `notes`.

**Licensing labels:** source text PD worldwide (published 1910, author
d. 1925); Wikisource transcription of PD text gains no new copyright
(credit Wikisource on the card as courtesy); structured dataset + English
glosses released CC0.

**Effort:** parser ~1 day incl. continuation stitching; ~522 English glosses
(batchable). Verify parsed count against the printed TOC ranges.

## Publishing sequence

1. **`myth-index` v1** — curation only; 4-surface publish per playbook
   (api `/v1/datasets/` + www `/datasets/` landing + HF + Kaggle).
2. **`aarne-1910-tale-types`** — parse + gloss; same 4 surfaces.
3. **Cross-link the pair** on both cards; create HF **collections**
   ("Comparative Mythology", "Parallel Scripture Corpora") to structure the
   org page.
4. **Seed** (r/datasets, awesome-digital-humanities, HF forum) only after
   both are live — pitch the pair, not the parts.

Cheap wins to bundle with the same push (from the same scout): fix Kaggle
controlled-vocab tags on the 6 existing datasets (0.47 usability); check HF
dataset-viewer renders the comparative sets (flat JSONL/CSV twins if not);
one Kaggle starter notebook on flood-myths.

Deferred / optional: AT 1928 English digitization (`PD-US-only` label, OCR
pipeline); Wikidata QID columns; multilingual glosses.

## Open decisions

- **PD bar:** worldwide-PD (excludes AT 1928) vs US-PD (archive.org's bar).
  Recommendation: worldwide for anything we relicense-adjacent publish;
  revisit AT 1928 only if the pair gets traction.
- **English glosses** in aarne v1 or as a fast follow-up version.
- **Scope:** myth-index does NOT subsume world-ages / prophets-and-religions
  (different row shapes — ages and founders, not motif attestations). Keep
  them siblings in the HF collection.
