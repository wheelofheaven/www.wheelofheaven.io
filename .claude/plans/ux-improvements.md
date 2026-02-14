# UX Improvements Plan

Prioritized improvements from UX audit (2026-02-14).

## 1. Add wiki category browsing
- **Status:** DONE
- 99 wiki entries categorized across 14 categories via Python script
- Categories: Elohim, Biblical Figures, Events & Narratives, Places & Locations, Peoples & Groups, Symbolism & Motifs, Cosmic Chronology, Science & Technology, Theology & Traditions, Methodology, Raëlism, Ufology, Reference Lists, Meta
- Wiki section template already had full category filtering/sorting support

## 2. Hide or simplify Articles section
- **Status:** DONE
- Fixed broken navbar link (`/explainers/` → `/articles/`)
- Replaced hardcoded "Explainers" text with `trans(key="navbarArticles")` for proper i18n
- Fixed both mobile and desktop nav links
- Updated footer link to use translation key

## 3. Add a "Method" / "Epistemics" page
- **Status:** DONE
- Created `content/essentials/our-method.md` (weight 7)
- Covers: working hypothesis definition, evidence handling, what we don't claim, cherry-picking avoidance, falsifiability
- Follows existing essentials format and scholarly-but-accessible voice

## 4. Add persona-driven language to homepage/essentials
- **Status:** DONE
- Rewrote homepage "Begin Your Journey" section with 5 persona-driven cards:
  - Essentials: "New here?" → guided tour
  - Timeline: "Love maps?" → precessional ages
  - Wiki: "Curious about a specific term?" → encyclopedia
  - Library: "Want the original sources?" → primary texts
  - Our Method: "Skeptical? Good." → evidence handling
- Resources moved to nav/footer (still accessible, less of an entry point)

## 5. Improve wiki cross-linking and "see also" visibility
- **Status:** DONE
- Category badge on wiki pages now links to wiki section filtered by category
- Added category badge styling (clickable, accent color)
- Related-content partial now shows category badges on cards
- Increased related items from 3 to 4
- Related-content already prioritizes same-category pages — now works with all 99 categorized entries
