+++
title = "Sample Concept"
slug = "sample-concept"
description = "A demonstration page showcasing all wiki features including table of contents, summary section, references, and various content types."
date = 2024-01-15
template = "wiki-page.html"

[extra]
summary = "This is a sample wiki entry that demonstrates all the features of the wiki layout including the table of contents, management summary, inline citations, info boxes, definition boxes, and reference sections. It serves as a template for creating new wiki entries."
category = "Meta"
alternative_names = [
    "Demo Page",
    "Example Entry",
    "Template Article",
    "Wiki Template"
]
see_also = [
    { title = "Elohim", path = "wiki/elohim/", description = "Core concept of the advanced extraterrestrial civilization" },
    { title = "Genesis", path = "wiki/genesis/", description = "Biblical account of creation from an ET perspective" }
]
external_links = [
    { title = "Zola Documentation", url = "https://www.getzola.org/documentation/", description = "Official documentation for the Zola static site generator" },
    { title = "Tera Templates", url = "https://tera.netlify.app/", description = "Template engine used by Zola" },
    { title = "BEM Methodology", url = "https://getbem.com/", description = "CSS naming convention used in this project" }
]
references = [
    { title = "The Art of Readable Code", author = "Dustin Boswell", publication = "O'Reilly Media", date = "2011", description = "Principles of writing clean, maintainable code" },
    { title = "Don't Make Me Think", author = "Steve Krug", publication = "New Riders", date = "2014", description = "Web usability principles for intuitive design" },
    { title = "Design Systems", author = "Alla Kholmatova", publication = "Smashing Magazine", date = "2017", description = "Building consistent design languages" }
]
+++

This page demonstrates the complete wiki layout system with all its features. It includes a table of contents, management summary, various content sections, and proper reference handling.

## Overview

The wiki system is designed to provide a comprehensive knowledge base experience with modern web standards and accessibility in mind. Each wiki entry follows a consistent structure that makes information easy to find and navigate.

### Key Features

The wiki layout includes several important components:

1. **Table of Contents**: Auto-generated navigation panel on the left
2. **Management Summary**: Prominent overview section below the title
3. **Structured Content**: Well-organized main content with proper typography
4. **Reference System**: Both inline citations and formal references section
5. **Related Links**: See also and external links sections

## Content Formatting

### Text Formatting

You can use standard Markdown formatting including **bold text**, *italic text*, and `inline code`. The typography system uses three font families:

- **Jost** for body text (clean, readable sans-serif)
- **Space Grotesk** for headings and emphasis (technical serif)
- **IBM Plex Mono** for code and technical elements

### Info Boxes

You can create informational callouts using the info shortcode:

{% info(type="info", title="Information") %}
This is an informational callout that can be used to highlight important details or provide additional context about a topic.
{% end %}

{% info(type="warning", title="Important Note") %}
Warning boxes can be used to alert readers to important considerations or potential misconceptions.
{% end %}

{% info(type="success", title="Key Insight") %}
Success boxes work well for highlighting breakthrough moments or important conclusions.
{% end %}

### Definition Boxes

For terminology, you can use definition boxes:

{% definition(term="Extraterrestrial Intelligence", type="scientific") %}
A hypothetical form of life that originates outside Earth, possessing cognitive abilities and technological capabilities that may exceed those of humanity.
{% end %}

### Code Examples

Technical content can include code blocks with syntax highlighting:

```toml
[extra]
summary = "Brief overview of the concept"
category = "Core Concepts"
references = [
    { title = "Source Title", author = "Author Name", date = "2024" }
]
```

## Citations and References

### Inline Citations

You can reference external sources using standard markdown footnotes[^1] or use the reference shortcode {{ reference(key="1", text="Ref 1") }} for custom reference linking.

### Footnotes

Standard markdown footnotes work seamlessly with the wiki layout. They appear at the bottom of the content and include return links for easy navigation.

## Subsections

### Scientific Context

The wiki system is particularly well-suited for scientific and technical content, with proper support for:

- Mathematical expressions (when needed)
- Scientific notation
- Technical diagrams and charts
- Research citations and academic references

### Historical Perspectives

Historical content benefits from the structured reference system, allowing readers to:

1. Access primary sources easily
2. Follow citation trails
3. Cross-reference related concepts
4. Understand chronological context

## Navigation Features

### Table of Contents

The left sidebar provides an interactive table of contents that:

- Auto-generates from your heading structure (H2, H3, H4)
- Highlights the current section (when JavaScript is enabled)
- Provides smooth scrolling navigation
- Adapts to mobile layouts

### Cross-References

The "See also" section at the bottom helps readers discover related concepts within the wiki, while external links provide access to outside resources and sources.

## Best Practices

When creating wiki entries, consider:

1. **Start with a clear summary** that explains the concept in 2-3 sentences
2. **Use consistent heading structure** for proper TOC generation
3. **Include relevant categories** to help with organization
4. **Add inline citations** for claims that need supporting evidence
5. **Link to related concepts** in the see also section
6. **Provide external resources** for further reading

### Writing Style

Wiki entries should maintain a:

- **Neutral, encyclopedic tone**
- **Clear, concise explanations**
- **Logical information hierarchy**
- **Consistent terminology usage**

## Technical Implementation

### Template Structure

The wiki uses a custom Zola template (`wiki-page.html`) that:

- Generates TOC from markdown headers
- Renders the summary section prominently
- Handles multiple reference types
- Provides responsive layout for all devices

### Styling Approach

The CSS follows BEM methodology with:

- **Semantic class names** for maintainability
- **CSS custom properties** for theming
- **Responsive design** principles
- **Accessibility** considerations

## Quote Examples

### Regular Blockquote with Author Profile

{% author(author="einstein", work="The World As I See It", year="1949") %}
Imagination is more important than knowledge. For knowledge is limited, whereas imagination embraces the entire world, stimulating progress, giving birth to evolution.
{% end %}

### Custom Author Quote

{% author(name="Custom Author", title="Example Title", work="Important Work", year="2024", url="https://example.com") %}
This demonstrates how to create a blockquote with a custom author who isn't in the authors database, including work reference with URL.
{% end %}

### Revelations Quote

{% revelation(title="The Book Which Tells The Truth", path="revelations/the-book-which-tells-the-truth", book="The Book Which Tells The Truth", chapter="1") %}
In the beginning, the Elohim created the heavens and the earth. This is not a supernatural creation story, but an account of scientific terraforming and biological engineering by an advanced extraterrestrial civilization.
{% end %}

### Standard Blockquote

> This is a regular blockquote without author profile. It uses the enhanced Spectral font styling but maintains the traditional blockquote appearance.
>
> <cite>Traditional Citation</cite>

[^1]: This is an example of a standard Markdown footnote. It will appear at the bottom of the page with a return link.

[^2]: Footnotes are automatically numbered and include bidirectional linking for easy navigation between the reference and the citation.