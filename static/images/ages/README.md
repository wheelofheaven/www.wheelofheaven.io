# Timeline Illustration Images

This directory contains older local illustration images. The current
`/timeline/` landing page uses the CDN-backed chapter figures referenced from
`content/timeline/*.md`.

## Image Requirements

- **Format**: AVIF, WebP, JPG, or PNG
- **Orientation**: Landscape (16:9 or similar aspect ratio)
- **Size**: Optimized for web (recommended: 800px width)
- **Quality**: High quality but web-optimized

## Slide Mapping

The landing page does not infer filenames from age names. Section-to-image
mapping lives in `data/timeline-slides.json`, where each section has ordered
slide records pointing to the same figure IDs used by `content/timeline/*.md`
and served under CDN `/images/`:

```json
{
  "age-of-aquarius": [
    {
      "src": "timeline/age-of-aquarius-rael-contact",
      "alt": "Cold cyan volcanic crater in Auvergne with frost, mist, a small metallic craft, and two tiny figures at the crater floor."
    }
  ]
}
```

Use stable section slugs such as `preamble`, `in-the-beginning`,
`age-of-capricorn`, and `wheel`. Each section renders its chapter figure set as
a full-viewport background sequence with a smooth opacity dissolve.
