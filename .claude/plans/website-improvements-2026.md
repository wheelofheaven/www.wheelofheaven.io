# Website Improvements & AI-Ready Features (2026)

A roadmap of potential improvements to make wheelofheaven.io more modern, accessible, and optimized for AI/LLM discovery.

---

## AI/LLM Optimization (AEO - Answer Engine Optimization)

### [x] llms.txt ✓
- New standard (like robots.txt) that tells AI crawlers how to understand your site
- Describes site purpose, content structure, and how to cite
- Quick win for AI discoverability
- Reference: https://llmstxt.org/
- **Implemented:** `/static/llms.txt` - includes content sections, key concepts, API access, languages, citation info

### [x] Enhanced Schema.org Markup ✓
- FAQPage schema for FAQ sections - **Implemented:** included in info-page.html
- HowTo schema for step-by-step guides - **Implemented:** included in essentials-page.html
- DefinedTerm, ScholarlyArticle, Book, Event schemas already in use
- [ ] QAPage schema for wiki Q&A-style entries (future)
- [ ] Course schema for learning paths (future)

### [x] Speakable Markup ✓
- **Already implemented:** `partials/schema/speakable.html` included in seo.html
- Uses `data-speakable` attributes on content sections
- Targets `.wiki__summary`, `.explainer__content`, etc.

### [x] AI Meta Tags Expansion ✓
- `ai.summary` - from page.extra.tldr (already existed)
- `ai.questions_answered` - auto-generated for wiki pages, or from page.extra.questions_answered
- `ai.key_concepts` - from page.extra.keywords or alternative_names
- `ai.reading_level` - beginner/intermediate/advanced based on section
- Plus existing: ai.content_type, ai.topic, ai.entity_type, ai.related_topics, ai.citations, etc.

---

## Content Features

### [x] Reading Progress Indicator ✓
- Thin bar at top of page showing scroll progress
- Helps users know how much content remains
- **Implemented:** `partials/reading-progress.html` included in base.html
- Shows gradient accent color bar, fades in after 100px scroll
- Only visible on content pages (wiki, explainer, essentials, resources, etc.)

### [ ] Highlight & Share
- Select text to get sharing options
- Copy quote with attribution
- Share to social media with selected text
- Save highlights (localStorage or account-based)

### [x] Glossary Tooltips ✓
- Hover over wiki links to see definitions inline
- **Implemented:** `partials/glossary-tooltip.html` included in base.html
- Fetches definition from linked wiki page (meta description or summary)
- Caches fetched definitions for performance
- Glassmorphism tooltip with "Wiki" badge
- Dotted underline styling for wiki links
- Hidden on touch devices (no hover)

### [ ] Related Content Suggestions
- "Read next" sections at end of articles
- Based on topics, tags, or content similarity
- Could use simple keyword matching or more advanced methods

### [ ] Table of Contents Improvements
- Sticky TOC that highlights current section
- Collapsible on mobile
- Progress indication within TOC

---

## Engagement & Social

### [x] Social Share Buttons ✓
- **Implemented:** Share to X/Twitter and Reddit
- **Implemented:** Copy link button with visual feedback
- **Implemented:** Native Web Share API on mobile (auto-detected)
- **Implemented:** Added to wiki, resources, explainers, and essentials pages
- Translations for all 9 languages

### [x] RSS/Atom Feeds ✓
- **Implemented:** Main site feeds at `/atom.xml` and `/rss.xml`
- **Implemented:** Per-section feeds (wiki, resources, essentials, explainers)
- **Implemented:** Feed autodiscovery links in HTML head
- **Implemented:** Per-language feeds for all supported languages
- Footer already links to main feed

### [ ] Newsletter Signup
- Email capture for updates
- Could use Buttondown, Mailchimp, or similar
- Subtle placement in footer or sidebar

### [ ] Comments/Annotations
- Disqus, Giscus (GitHub-based), or custom solution
- Or: Hypothesis-style web annotations
- Moderation considerations

### [ ] Reading Lists / Bookmarks
- Let users save articles to read later
- localStorage-based (no account needed)
- Or account-based for cross-device sync

---

## Technical & Performance

### [ ] Image Optimization
- Convert images to WebP/AVIF formats
- Implement lazy loading for below-fold images
- Responsive images with srcset
- Image CDN consideration

### [ ] Enhanced PWA / Offline Mode
- Cache articles for offline reading
- Background sync for reading progress
- Install prompts on mobile
- Offline indicator

### [ ] Search Improvements
- Better fuzzy matching in Fuse.js
- Search filters (by section, date, topic)
- Search suggestions/autocomplete
- Recent searches

### [ ] Performance Audit
- Core Web Vitals optimization
- Reduce JavaScript bundle size
- Critical CSS inlining
- Preload key resources

---

## Accessibility

### [x] Keyboard Shortcuts ✓
- **Implemented:** `/` to open search
- **Implemented:** `?` to show shortcut help modal
- **Implemented:** `Escape` to close modals/panels
- **Implemented:** `j`/`k` for next/previous article navigation
- **Implemented:** `h` to go home
- Hidden on touch devices (no keyboard)
- Translations for all 9 languages

### [ ] Font Size Controls
- User-adjustable text size
- Remember preference in localStorage
- Accessible sizing (rem-based)

### [ ] High Contrast Mode
- Beyond standard dark/light themes
- True high contrast for low vision users
- Reduce motion option

### [ ] Skip Links Enhancement
- More skip links for complex pages
- Skip to TOC, skip to comments, etc.

### [ ] Focus Indicators
- Visible focus rings for all interactive elements
- Consistent focus styling across components

---

## Content Expansion

### [ ] Multilingual Content Parity
- Translate remaining English content to other languages
- Prioritize high-traffic pages
- Translation workflow/tools

### [ ] Interactive Timeline
- Visual timeline with zoom/pan
- Filter by category/topic
- Connect to related wiki entries

### [ ] Maps & Visualizations
- Interactive map of locations mentioned
- Data visualizations where relevant
- Charts for timeline data

---

## Priority Recommendations

### Quick Wins (Low effort, high impact)
1. ~~llms.txt - Single file, immediate AI visibility~~ ✓
2. ~~Reading progress indicator - Simple CSS/JS~~ ✓
3. ~~Social share buttons - Standard component~~ ✓

### Medium Effort
4. ~~RSS/Atom feeds - Zola supports this~~ ✓
5. ~~Keyboard shortcuts - JavaScript addition~~ ✓
6. ~~Glossary tooltips - Requires term detection~~ ✓

### Larger Projects
7. Offline PWA mode - Service worker complexity
8. Comments system - Moderation overhead
9. Interactive timeline - Custom development

---

## Implementation Notes

- All features should respect the existing design language
- Mobile-first approach for new components
- Accessibility must be considered from the start
- Performance impact should be measured for each feature
- Consider feature flags for gradual rollout

---

*Last updated: 2026-01-24 (Keyboard shortcuts added)*
