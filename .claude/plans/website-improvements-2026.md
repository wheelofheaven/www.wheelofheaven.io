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

### [ ] Enhanced Schema.org Markup
- Add FAQPage schema for FAQ sections
- Add QAPage schema for wiki Q&A-style entries
- Add HowTo schema for step-by-step guides
- Add Course schema for learning paths

### [ ] Speakable Markup
- Mark content sections optimized for voice assistants
- Already have some `data-speakable` attributes
- Expand to more content types

### [ ] AI Meta Tags Expansion
- Add `ai.summary` for each page (TLDR)
- Add `ai.questions_answered` listing questions the page answers
- Add `ai.key_concepts` listing main topics
- Add `ai.reading_level` for content difficulty

---

## Content Features

### [ ] Reading Progress Indicator
- Thin bar at top of page showing scroll progress
- Helps users know how much content remains
- Simple to implement, nice UX

### [ ] Highlight & Share
- Select text to get sharing options
- Copy quote with attribution
- Share to social media with selected text
- Save highlights (localStorage or account-based)

### [ ] Glossary Tooltips
- Hover over wiki terms to see definitions inline
- Auto-link recognized terms in content
- Non-intrusive tooltip or popover
- Links to full wiki entry

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

### [ ] Social Share Buttons
- Share to X/Twitter, Reddit, Facebook, LinkedIn
- Copy link button
- Native Web Share API on mobile
- Floating or inline placement options

### [ ] RSS/Atom Feeds
- Main site feed for all updates
- Per-section feeds (wiki, explainers, resources)
- JSON Feed format option
- Helps with content syndication

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

### [ ] Keyboard Shortcuts
- `j`/`k` for next/previous article
- `/` to focus search
- `?` to show shortcut help
- `Escape` to close modals

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
1. llms.txt - Single file, immediate AI visibility
2. Reading progress indicator - Simple CSS/JS
3. Social share buttons - Standard component

### Medium Effort
4. RSS/Atom feeds - Zola supports this
5. Keyboard shortcuts - JavaScript addition
6. Glossary tooltips - Requires term detection

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

*Last updated: 2026-01-24*
