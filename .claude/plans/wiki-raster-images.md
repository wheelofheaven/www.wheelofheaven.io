# Wiki raster images — Codex handoff brief

Task for the image-generation agent: produce **portrait raster images for five
"place" wiki entries** that currently have none, and wire each into its content
file. All five are *places* — depict the place, never people.

Repo: the `www.wheelofheaven.world` working copy. Wiki content lives in the
`data-content` submodule at `content/wiki/{slug}.md`. Image binaries are hosted
on the CDN at `https://assets.wheelofheaven.world/images/wiki/` and are published
from the **assets repo** (find where `elohim-collective-v2.webp` lives and drop
new files alongside it — that is the model for everything below).

---

## Shared production spec (applies to all five)

- **Orientation / size:** portrait, **3:4, 1200×1600 px**.
- **Formats:** produce **two** files per image — `.webp` (primary, high quality)
  and `.avif` (variant). Model the filenames on the existing convention
  `elohim-collective-v2.webp` / `.avif`.
- **Register (the whole point — avoid AI slop):** painterly, naturalistic,
  atmospheric — a restrained landscape/architecture study, in the vein of
  classical romantic landscape painting. Muted, cohesive palette. **NOT** glossy
  digital fantasy art, concept-art render, HDR, or lens-flare.
- **Universal hard constraints:**
  - No text, letters, or watermarks anywhere.
  - **No human figures, faces, or characters**, and no depiction of the
    Elohim/Yahweh — landscape and architecture only.
  - No modern elements (cars, power lines, signage, machinery) unless the
    subject itself is modern.
  - No overt religious iconography (halos, glowing symbols, crosses, snakes).
  - Avoid symmetry-gimmicks.
- **Wiring:** add the four `[extra]` fields shown per entry to
  `content/wiki/{slug}.md`, mirroring `content/wiki/elohim.md` (primary is WebP,
  `image_avif` is the AVIF source). The `wiki-page.html` template renders these
  automatically as the sidebar portrait (`<picture>` with AVIF source + WebP
  `<img>`) — **no template changes needed.**
- **Verify:** run `zola build`, then confirm each
  `public/wiki/{slug}/index.html` contains a `<figure class="wiki__portrait">`
  with the new image URL.

---

## 1. Eden  — `eden`  ✅ safe

**Subject:** The Garden of Eden as a *place* — a primeval, **enclosed**
river-valley garden (Hebrew *gan* = a bounded, protected sanctuary, not an open
park). Lush vegetation, the four-rivers motif (Genesis 2:10 — four watercourses
diverging), soft dawn / golden-hour light, a sense of a protected valley.

```toml
image = "https://assets.wheelofheaven.world/images/wiki/eden-garden-v1.webp"
image_avif = "https://assets.wheelofheaven.world/images/wiki/eden-garden-v1.avif"
image_alt = "A painterly landscape of a primeval, enclosed river-valley garden at dawn, with four watercourses diverging."
image_caption = "Eden as place — the enclosed four-rivers garden of Genesis 2."
```

## 2. Petra  — `petra`  ✅ safe (real place)

**Subject:** The real Nabataean rock-cut city in southern Jordan — **rose-red
sandstone façades carved directly into canyon cliffs** (the treasury/tomb
façades, the narrow Siq gorge opening onto a carved front). Low golden light
raking the carved stone. This is an actual, iconic archaeological site: keep it
grounded and plausible, just rendered in the painterly register.

```toml
image = "https://assets.wheelofheaven.world/images/wiki/petra-nabataean-v1.webp"
image_avif = "https://assets.wheelofheaven.world/images/wiki/petra-nabataean-v1.avif"
image_alt = "The rock-cut Nabataean façades of Petra in rose-red sandstone, carved into a canyon cliff under low golden light."
image_caption = "Petra — the rock-cut Nabataean capital at the centre of the qibla-orientation hypothesis."
```

## 3. Pangaea  — `pangaea`  ✅ safe

**Subject:** The single antediluvian supercontinent — **one vast landmass
surrounded by a single world-ocean (azure seas)**, seen from **high altitude /
near-orbital** vantage. Think a painterly world-view: one continent, one ocean,
clouds, curvature of the horizon. Geological/atmospheric, not cartographic
(no grid lines or labels).

```toml
image = "https://assets.wheelofheaven.world/images/wiki/pangaea-supercontinent-v1.webp"
image_avif = "https://assets.wheelofheaven.world/images/wiki/pangaea-supercontinent-v1.avif"
image_alt = "A single vast supercontinent surrounded by one world-ocean, seen from high altitude — the antediluvian landmass."
image_caption = "Pangaea — the single antediluvian landmass, substrate of the Eden and dispersed-civilisation phases."
```

## 4. Elohim Home Planet  — `elohim-home-planet`  ⚠️ higher slop risk

**Subject:** The Elohim's extrasolar world, exactly as the source describes it:
**mild climate, lush exotic vegetation, azure seas, beneath a noticeably large,
low sun** (the home star is larger than the Sun). A serene, Edenic *alien
landscape*.

**Extra constraints for this one — this is where it tips into kitsch:**
- **No spacecraft, no futuristic cities, no domes, no technology, no figures.**
- The only "not Earth" cue should be the **oversized low sun** and subtly exotic
  (but still naturalistic, plant-like) flora — not neon, not bioluminescent, not
  psychedelic. If in doubt, render a tranquil paradise coastline and enlarge the
  sun. Discard anything that reads as sci-fi cover art.

```toml
image = "https://assets.wheelofheaven.world/images/wiki/elohim-home-planet-v1.webp"
image_avif = "https://assets.wheelofheaven.world/images/wiki/elohim-home-planet-v1.avif"
image_alt = "A tranquil extrasolar coastline — lush exotic vegetation and azure seas beneath a large, low sun."
image_caption = "The Elohim home world as the source describes it: mild, lush, azure-sea'd, beneath a larger star."
```

## 5. Third Temple  — `third-temple`  ⚠️ most speculative (canon-specific)

**Subject:** The anticipated Third Temple, which the framework identifies with
the **Embassy** (the Elohim reception residence). Render it as a **restrained
architectural vision**: a dignified **walled temple-and-residence complex on a
height**, with ordered courts and gateways in the spirit of Ezekiel 40–48's
proportioned plan, set in a calm landscape under evening light.

**Extra constraints:**
- **No people, no crowds, no modern city, no cranes/construction.**
- No overt religious iconography (no menorah/cross/crescent, no glowing ark) —
  let the **architecture** carry it. Stone, courts, colonnades, a surrounding
  wall; dignified and serene, not monumental-kitsch.
- Do **not** depict the real present-day Temple Mount / Dome of the Rock — this
  is the *envisioned* structure, a landscape-set architectural study.

```toml
image = "https://assets.wheelofheaven.world/images/wiki/third-temple-embassy-v1.webp"
image_avif = "https://assets.wheelofheaven.world/images/wiki/third-temple-embassy-v1.avif"
image_alt = "A serene walled temple-and-residence complex on a height, with ordered courts, in evening light."
image_caption = "The Third Temple read as the Embassy — the reception residence of Ezekiel's restoration vision."
```

---

## Optional — i18n propagation

Raster images are language-neutral, so the same file serves every language. To
show each portrait on the translated pages too, add the same `image` /
`image_avif` fields to each `content/{de,es,fr,ja,ko,ru,zh,zh-Hant,he}/wiki/{slug}.md`,
translating **only** `image_alt` and `image_caption` per language. (This mirrors
how the diagram captions were localized. Skip any language where the entry
doesn't exist.)

## Suggested order

Do the three **safe** ones first (Eden, Petra, Pangaea) and get sign-off on the
look before spending effort on the two ⚠️ speculative ones (Elohim Home Planet,
Third Temple), which are the most likely to need re-rolls.
