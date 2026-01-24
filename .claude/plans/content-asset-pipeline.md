# Wheel of Heaven: Content & Asset Pipeline Architecture

## Overview

A unified pipeline architecture enabling content to flow from source repositories to multiple distribution targets with transformations, optimizations, and automation.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            SOURCE REPOSITORIES                               │
├─────────────────┬─────────────────┬─────────────────┬─────────────────────────┤
│  data-content   │  data-library   │  data-images    │  bifrost               │
│  (Markdown)     │  (JSON)         │  (Media)        │  (Theme)               │
└────────┬────────┴────────┬────────┴────────┬────────┴────────┬───────────────┘
         │                 │                 │                 │
         ▼                 ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PROCESSING LAYER                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Content     │  │  Library     │  │  Image       │  │  Theme       │     │
│  │  Processor   │  │  Processor   │  │  Processor   │  │  Compiler    │     │
│  │              │  │              │  │              │  │              │     │
│  │ • Parse MD   │  │ • Validate   │  │ • Resize     │  │ • SCSS→CSS   │     │
│  │ • Extract    │  │ • Index      │  │ • Compress   │  │ • Bundle JS  │     │
│  │   metadata   │  │ • Search     │  │ • WebP       │  │ • Optimize   │     │
│  │ • Transform  │  │   index      │  │ • CDN prep   │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────────────────────┘
         │                 │                 │                 │
         ▼                 ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DISTRIBUTION TARGETS                                 │
├─────────────────┬─────────────────┬─────────────────┬─────────────────────────┤
│  Website        │  API            │  Social         │  Future                │
│  (Zola SSG)     │  (Static JSON)  │  (Syndication)  │  (Mobile, etc.)        │
│                 │                 │                 │                        │
│ www.wheel...    │ api.wheel...    │ Twitter/X       │ Native apps            │
│                 │                 │ Mastodon        │ EPUB exports           │
│                 │                 │ Newsletter      │ PDF generation         │
│                 │                 │ RSS/Atom        │ Headless CMS           │
└─────────────────┴─────────────────┴─────────────────┴─────────────────────────┘
```

---

## Repository Architecture

### Source Repositories

| Repository | Type | Description |
|------------|------|-------------|
| `data-content` | Markdown + TOML | Wiki, timeline, resources, articles, translations |
| `data-library` | JSON | Book/scripture data with full text |
| `data-images` | Binary | Original media assets |
| `bifrost` | SCSS/Tera/JS | Zola theme (templates, styles, scripts) |

### Consumer Repositories

| Repository | Consumes | Produces |
|------------|----------|----------|
| `www.wheelofheaven.io` | data-content, data-library, bifrost | Static HTML website |
| `api.wheelofheaven.io` | data-content, data-library | Static JSON API |
| `utilities` | data-content, data-library | Processing tools |

---

## Pipeline Components

### 1. Content Pipeline

**Source:** `data-content/` (Markdown with TOML frontmatter)

**Transformations:**

```
data-content/*.md
       │
       ├──► Zola (www) ──► HTML pages
       │
       ├──► MD Parser ──► JSON (api)
       │
       ├──► Excerpt Extractor ──► Social posts
       │
       ├──► RSS Generator ──► Feeds
       │
       └──► Translation Pipeline ──► Localized content
```

**Content Processor Features:**
- Parse TOML frontmatter → structured metadata
- Extract summaries, quotes, key points
- Generate excerpts for social media
- Build search indices
- Validate internal links
- Check translation coverage

### 2. Library Pipeline

**Source:** `data-library/` (JSON book data)

**Transformations:**

```
data-library/*.json
       │
       ├──► Zola (www) ──► Reader UI
       │
       ├──► API Templates ──► /v1/books/* endpoints
       │
       ├──► Search Indexer ──► Full-text search
       │
       ├──► EPUB Generator ──► E-book exports
       │
       └──► Citation Builder ──► Reference formats
```

**Library Processor Features:**
- Validate book JSON schema
- Generate chapter/paragraph indices
- Build cross-reference links
- Create canonical reference IDs (TBWTT-1:5)
- Export to EPUB/PDF formats

### 3. Image Pipeline

**Source:** `data-images/` (original assets)

**Transformations:**

```
data-images/originals/*
       │
       ├──► Resizer ──► Multiple sizes (thumbnail, medium, large)
       │
       ├──► Compressor ──► Optimized JPG/PNG
       │
       ├──► WebP Converter ──► Modern format
       │
       ├──► Metadata Extractor ──► EXIF, dimensions
       │
       └──► CDN Uploader ──► Cloudflare/S3
```

**Image Processor Features:**
- Responsive image generation (srcset)
- WebP with fallbacks
- Lazy loading placeholders (LQIP)
- Alt text validation
- CDN cache invalidation

### 4. Theme Pipeline

**Source:** `bifrost/` (SCSS, Tera, JS)

**Transformations:**

```
bifrost/
       │
       ├──► SCSS Compiler ──► Minified CSS
       │
       ├──► JS Bundler ──► Optimized scripts
       │
       ├──► Asset Hasher ──► Cache-busted URLs
       │
       └──► Theme Packager ──► Distributable theme
```

**Theme Compiler Features:**
- SCSS → CSS with source maps
- CSS purging (remove unused)
- JS minification and bundling
- Asset fingerprinting
- Theme versioning

### 5. Translation Pipeline

**Source:** English content in `data-content/`

**Transformations:**

```
data-content/wiki/elohim.md (en)
       │
       ├──► LLM Translator ──► data-content/de/wiki/elohim.md
       │                   ──► data-content/fr/wiki/elohim.md
       │                   ──► data-content/ja/wiki/elohim.md
       │                   ──► ... (9 languages)
       │
       └──► Translation Memory ──► Consistency database
```

**Translation Features:**
- Multi-provider support (Claude, OpenAI, DeepL, Ollama)
- Translation memory for consistency
- Terminology glossary enforcement
- Diff-based incremental translation
- Human review queue

---

## Automation & CI/CD

### GitHub Actions Workflows

```yaml
# On data-content push:
- Validate frontmatter
- Check internal links
- Trigger www rebuild
- Trigger api rebuild
- Generate social excerpts

# On data-library push:
- Validate JSON schema
- Update search index
- Trigger www rebuild
- Trigger api rebuild

# On bifrost push:
- Compile SCSS
- Run accessibility tests
- Update www submodule
- Deploy preview

# On data-images push:
- Process new images
- Upload to CDN
- Update manifest
```

### Scheduled Jobs

```yaml
# Daily:
- Check for stale translations
- Validate external links
- Generate analytics report

# Weekly:
- Full site rebuild
- Search index optimization
- Broken link report
```

---

## Directory Structure (Future State)

```
wheelofheaven/
├── data-content/              # Content source
│   ├── wiki/
│   ├── timeline/
│   ├── resources/
│   ├── articles/
│   ├── essentials/
│   ├── explainers/
│   ├── library/               # Library section pages (not book data)
│   ├── de/, es/, fr/, ja/, ko/, ru/, zh/, zh-Hant/
│   └── _index.md
│
├── data-library/              # Book/scripture data
│   ├── catalog.json
│   ├── traditions.json
│   └── books/
│       └── the-book-which-tells-the-truth.json
│
├── data-images/               # Media assets
│   ├── originals/
│   ├── processed/
│   └── manifest.json
│
├── bifrost/                   # Zola theme
│   ├── theme.toml
│   ├── templates/
│   ├── sass/
│   ├── static/
│   └── i18n/
│
├── www.wheelofheaven.io/      # Main website
│   ├── config.toml
│   ├── content/               → submodule: data-content
│   ├── themes/bifrost/        → submodule: bifrost
│   └── data/library/          → submodule: data-library
│
├── api.wheelofheaven.io/      # JSON API
│   ├── config.toml
│   ├── templates/
│   ├── data/content/          → submodule: data-content
│   └── data/library/          → submodule: data-library
│
├── utilities/                 # Processing tools
│   ├── tools/
│   │   ├── translate.py
│   │   ├── image_processor.py
│   │   ├── content_validator.py
│   │   └── social_generator.py
│   └── providers/
│
└── reference/                 # Documentation
    └── ...
```

---

## Implementation Phases

### Phase 1: Foundation ✅
- [x] Create data-content repository
- [x] Migrate content from www
- [x] Set up submodule architecture
- [x] API consumes data-content

### Phase 2: Theme Extraction (Current)
- [ ] Create bifrost repository
- [ ] Extract templates, sass, static
- [ ] Create theme.toml
- [ ] Update www to use theme submodule
- [ ] Document theme customization

### Phase 3: Image Pipeline
- [ ] Organize data-images structure
- [ ] Create image processing scripts
- [ ] Set up CDN integration
- [ ] Implement responsive images in theme

### Phase 4: Content Automation
- [ ] Content validation CI
- [ ] Translation coverage reports
- [ ] Social media excerpt generator
- [ ] RSS/Atom feed generation

### Phase 5: Advanced Features
- [ ] Full-text search API
- [ ] EPUB/PDF export
- [ ] Newsletter integration
- [ ] Analytics dashboard

---

## Tools & Technologies

| Component | Technology |
|-----------|------------|
| Static Site Generator | Zola 0.21.0 |
| Templating | Tera |
| Styling | SCSS (7-1 architecture) |
| Task Runner | mise |
| CI/CD | GitHub Actions |
| CDN | Cloudflare |
| Translation | Claude, OpenAI, DeepL, Ollama |
| Image Processing | Sharp (Node.js) or Pillow (Python) |
| Search | Fuse.js (client) / Meilisearch (future) |

---

## Benefits

1. **Single Source of Truth** - Content lives in one place, consumed everywhere
2. **Separation of Concerns** - Content, presentation, and data are independent
3. **Scalability** - Add new distribution targets without changing sources
4. **Maintainability** - Update theme once, propagates to all consumers
5. **Collaboration** - Content editors don't need to understand site code
6. **Automation** - CI/CD handles builds, validation, and deployment
7. **Flexibility** - Easy to pivot to new technologies or platforms
