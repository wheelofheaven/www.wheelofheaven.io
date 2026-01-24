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

### [x] Highlight & Share ✓
- **Implemented:** Select text to show popup with sharing options
- **Implemented:** Copy quote with attribution (title + URL)
- **Implemented:** Share to X/Twitter with selected text
- **Implemented:** Share to Reddit with selected text
- Works in all content areas (wiki, resources, explainers, essentials)
- Hidden on touch devices
- Translations for all 9 languages

### [x] Glossary Tooltips ✓
- Hover over wiki links to see definitions inline
- **Implemented:** `partials/glossary-tooltip.html` included in base.html
- Fetches definition from linked wiki page (meta description or summary)
- Caches fetched definitions for performance
- Glassmorphism tooltip with "Wiki" badge
- Dotted underline styling for wiki links
- Hidden on touch devices (no hover)

### [x] Related Content Suggestions ✓
- **Implemented:** "Read Next" sections at end of articles
- **Implemented:** Shows up to 3 related pages from the same section
- **Implemented:** Prioritizes pages with matching category/topics
- Added to wiki, resources, explainers, and essentials pages
- Responsive grid layout (1-3 columns)
- Translations for all 9 languages

### [x] Table of Contents Improvements ✓
- **Already had:** Sticky TOC sidebar on desktop
- **Implemented:** Highlights current section as user scrolls
- **Implemented:** Auto-scrolls TOC to keep active link visible
- Works on wiki, resources, and explainer pages
- Uses IntersectionObserver-like scroll detection
- Smooth transitions with accent color highlight

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

### [x] Reading Lists / Bookmarks ✓
- **Implemented:** localStorage-based reading list (no account needed)
- **Implemented:** Bookmark button in social share component
- **Implemented:** Reading list toggle button in navbar
- **Implemented:** Slide-out panel showing saved articles
- **Implemented:** Service worker caches bookmarked pages for offline
- **Implemented:** Keyboard shortcuts (b to bookmark, B to open list)
- **Implemented:** Translations for all 9 languages
- JavaScript in `static/js/reading-list.js`
- Styles in `sass/components/_reading-list.scss`

---

## Technical & Performance

### [ ] Image Optimization
- Convert images to WebP/AVIF formats
- Implement lazy loading for below-fold images
- Responsive images with srcset
- Image CDN consideration

### [x] Enhanced PWA / Offline Mode ✓
- **Implemented:** Service worker (sw.js) caches pages and static assets
- **Implemented:** Offline fallback page with list of cached pages
- **Implemented:** Install prompt banner on mobile/desktop
- **Implemented:** Offline indicator when connection lost
- **Implemented:** Save for offline button in social share component
- Background sync for reading progress (foundation in place)

### [x] Search Improvements ✓
- **Implemented:** Better fuzzy matching (threshold 0.3, distance 100, minMatchCharLength 2)
- **Implemented:** Section filter chips (Wiki, Essentials, Explainers, Timeline, Resources, Articles, Library)
- **Implemented:** Popular search suggestions with section badges
- **Implemented:** Recent searches (localStorage, max 5, clearable)
- **Implemented:** Results count display

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

### [x] Skip Links Enhancement ✓
- **Implemented:** Multiple skip links (content, TOC, search, footer)
- **Implemented:** TOC link auto-detects if page has table of contents
- **Implemented:** Search link focuses search input
- **Implemented:** Glassmorphism design, shows on focus
- **Implemented:** Mobile-responsive (stacks vertically)
- **Implemented:** Translations for all 9 languages

### [x] Focus Indicators ✓
- **Implemented:** Visible focus rings for all interactive elements
- **Implemented:** Consistent focus-visible styling (keyboard-only)
- **Implemented:** Uses `--color-focus` CSS variable for theming
- **Implemented:** Special styles for inputs (box-shadow), cards (glow), navigation
- **Implemented:** High contrast mode support (3px solid outline)
- **Implemented:** Reduced motion support
- Focus mixins added to `abstracts/_mixins.scss`
- Styles in `sass/components/_focus.scss`

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
7. ~~Offline PWA mode - Service worker complexity~~ ✓
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

*Last updated: 2026-01-24 (Reading Lists / Bookmarks added)*
