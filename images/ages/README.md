# Timeline Illustration Images

This directory contains landscape-oriented illustration images used by the
`/timeline/` landing page reels.

## Image Requirements

- **Format**: AVIF, WebP, JPG, or PNG
- **Orientation**: Landscape (16:9 or similar aspect ratio)
- **Size**: Optimized for web (recommended: 800px width)
- **Quality**: High quality but web-optimized

## Slide Mapping

The landing page does not infer filenames from age names. Section-to-image
mapping lives in `data/timeline-slides.json`, where each section has three
ordered slide records:

```json
{
  "age-of-aquarius": [
    {
      "src": "images/ages/modern-urban-landscape.avif",
      "alt": "Modern technological city"
    }
  ]
}
```

Use stable section slugs such as `preamble`, `in-the-beginning`,
`age-of-capricorn`, and `wheel`. The template duplicates each three-image set
once so the reel can loop smoothly.
