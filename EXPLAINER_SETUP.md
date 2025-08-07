# Explainer System Setup Guide

This document explains how to use the new explainer system in the Wheel of Heaven Zola site.

## Overview

The explainer system uses **exactly the same styling as the wiki** but with these specific differences:
- No table of contents (TOC) sidebar
- Landscape hero image instead of wiki header
- No "alternative names" section
- No "summary" section
- Same references, external links, and content styling as wiki

## Key Features

- **Hero Images**: Landscape header images or category-specific gradient backgrounds
- **Exact Wiki Styling**: Same colors, typography, spacing, and visual design
- **Category Taxonomy**: Organized by topic categories with filtering
- **Academic References**: Proper citations with descriptions and hairline separator
- **Search & Filter**: Same discovery tools as wiki section
- **Multiple Views**: Grid and list display modes
- **Alphabetical Navigation**: Quick-jump letter links

## File Structure

```
content/explainers/
├── _index.md                    # Section index page
├── example-explainer.md         # Example explainer
└── [category]/                  # Optional category subdirectories
    └── topic-name.md

templates/
├── explainer-page.html          # Individual explainer template
├── explainer-section.html       # Section listing template
└── macros/
    └── explainer.html           # Reusable components

sass/pages/
├── _explainer.scss              # Individual page styles
└── _explainer-section.scss      # Section listing styles

static/images/explainers/        # Header images directory
```

## Creating an Explainer

### 1. Create the Markdown File

Create a new `.md` file in `content/explainers/` with the following frontmatter:

```toml
+++
title = "Your Explainer Title"
description = "Brief description for SEO and previews"
date = 2024-01-15
template = "explainer-page.html"

[extra]
category = "Philosophy"                    # Required: organizing category
header_image = "/images/explainers/topic.jpg"  # Optional: hero image path
featured = true                           # Optional: show in featured section

# Optional: academic references
[[extra.references]]
title = "Source Title"
author = "Author Name"
publication = "Publication"
date = "2023"
url = "https://example.com/source"  # Optional
description = "Why this source matters"
+++
```

### 2. Write the Content

Structure your content with clear headings and logical flow:

```markdown
# Main Title

Introduction paragraph that hooks the reader and explains what they'll learn.

## Section 1: Foundation Concepts

### Subsection A
Detailed explanation with examples.

### Subsection B
Building on previous concepts.

### Including Quotes
> Standard academic viewpoint on this topic using regular blockquotes.

Use standard markdown blockquotes exactly like in the wiki - no special classes needed.

## Section 2: Advanced Topics

Continue building complexity...

## Conclusion

Summarize key takeaways and next steps.
```

## Categories

Organize explainers using these suggested categories:

- **Philosophy**: Conceptual frameworks and theoretical discussions
- **Science**: Scientific topics and research
- **Technology**: Technical concepts and systems
- **History**: Historical events and contexts
- **Culture**: Social and cultural topics
- **Astronomy**: Space and cosmic phenomena
- **Biology**: Life sciences and biological systems

Add new categories as needed by simply using them in the frontmatter.

## Header Images

### Using Custom Images

1. Add landscape images (16:9 or similar ratio) to `static/images/explainers/`
2. Reference them in frontmatter: `header_image = "/images/explainers/filename.jpg"`
3. Recommended dimensions: 1200x675px or larger
4. Use descriptive filenames: `quantum-mechanics-header.jpg`

### Automatic Gradient Backgrounds

If no `header_image` is specified, the system generates category-specific gradient backgrounds:

- **Astronomy**: Blue/purple cosmic theme
- **Biology**: Green natural theme  
- **Technology**: Gray/silver tech theme
- **Philosophy**: Orange/red thoughtful theme
- **Default**: Primary brand colors

## Templates and Styling

### Template Structure

The explainer system uses the exact same HTML structure as wiki pages, with these changes:
- `explainer-page.html` instead of `wiki-page.html`
- `explainer-section.html` instead of `wiki-section.html`
- Hero image section replaces wiki header
- Same CSS classes with `explainer` prefix instead of `wiki`

### Customizing Styles

Edit the SCSS files to customize appearance:

- `sass/pages/_explainer.scss`: Exact copy of wiki page styles with hero image
- `sass/pages/_explainer-section.scss`: Exact copy of wiki section styles

### Category-Specific Hero Gradients

Category-specific gradients are already included for:
- astronomy: Blue/purple theme
- biology: Green theme  
- technology: Gray theme
- philosophy: Orange/red theme

## Best Practices

### Content Guidelines

1. **Start with Why**: Explain why the topic matters before diving into details
2. **Build Progressively**: Structure content from basic to advanced concepts
3. **Use Examples**: Include concrete examples and analogies
4. **Use Blockquotes**: Standard markdown blockquotes work exactly like in wiki
5. **Cite Sources**: Always include references for claims and data
6. **Keep Updated**: Update content when new information becomes available

### SEO and Discoverability

1. **Descriptive Titles**: Use clear, searchable titles
2. **Meta Descriptions**: Write compelling descriptions for search results
3. **Categories**: Use consistent categorization for browsing
4. **Internal Linking**: Reference related content extensively

### Technical Considerations

1. **Image Optimization**: Compress header images for fast loading
2. **Mobile-First**: Content should work well on all screen sizes  
3. **Accessibility**: Use proper heading hierarchy and alt text
4. **Performance**: Keep external links to a reasonable number

## Section Management

### Configuring the Section Page

Edit `content/explainers/_index.md` to customize:

- Section title and description
- Introduction content
- Template assignment
- Sorting options

### Adding Subsections

Create subdirectories for topic areas:

```
content/explainers/
├── philosophy/
│   └── _index.md
├── science/
│   └── _index.md
└── technology/
    └── _index.md
```

## JavaScript Features

The section page includes interactive features:

- **Search**: Real-time filtering by title and content
- **Category Filter**: Dropdown to filter by category
- **Sort Options**: Sort by title, date, or category
- **View Toggle**: Switch between grid and list views
- **Alphabet Navigation**: Quick jump to specific letters

These features work automatically with the default templates.

## Testing Your Setup

1. Create a test explainer using the example format
2. Build the site: `zola build`
3. Check the explainer section at `/explainers/`
4. Verify individual explainer pages render correctly
5. Test search, filtering, and navigation features

## Troubleshooting

### Common Issues

- **Template not found**: Ensure `template = "explainer-page.html"` in frontmatter
- **Styles not loading**: Check that SCSS imports are added to `sass/main.scss`
- **Images not showing**: Verify image paths and file existence
- **Search not working**: Check JavaScript console for errors
- **Styling issues**: Explainers use exact wiki CSS - check wiki styling works first

### Getting Help

Refer to the Zola documentation for general templating and content management guidance. For explainer-specific issues, check the example files and macro implementations.