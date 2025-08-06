+++
title = "How to Use the Wiki"
slug = "how-to-use-wiki"
description = "Complete guide on creating and formatting wiki entries, using the available templates, shortcodes, and styling features."
date = 2024-01-15
template = "wiki-page.html"

[extra]
summary = "This comprehensive guide explains how to create, format, and structure wiki entries using the available templates, shortcodes, and styling features. It covers everything from basic frontmatter configuration to advanced content formatting and reference management."
category = "Meta"
alternative_names = [
    "Wiki Documentation",
    "Wiki Guide",
    "Content Creation Guide",
    "Wiki Manual"
]
see_also = [
    { title = "Sample Concept", path = "wiki/sample-concept/", description = "Example wiki page showing all features" }
]
external_links = [
    { title = "Zola Documentation", url = "https://www.getzola.org/documentation/", description = "Official Zola static site generator documentation" },
    { title = "Markdown Guide", url = "https://www.markdownguide.org/", description = "Comprehensive markdown syntax reference" },
    { title = "BEM Methodology", url = "https://getbem.com/", description = "CSS naming convention used in this project" }
]
references = [
    { title = "The Elements of Typographic Style", author = "Robert Bringhurst", publication = "Hartley & Marks", date = "2004", description = "Classic guide to typography and text design" },
    { title = "Information Architecture for the Web and Beyond", author = "Louis Rosenfeld", publication = "O'Reilly Media", date = "2015", description = "Best practices for organizing digital content" }
]
+++

This guide provides comprehensive instructions for creating and maintaining wiki entries in the Wheel of Heaven knowledge base. The wiki system is designed to provide a consistent, accessible, and visually appealing way to present complex information.

## Getting Started

### Creating a New Wiki Page

To create a new wiki page, create a markdown file in the `content/wiki/` directory:

```bash
touch content/wiki/your-concept.md
```

### Basic Frontmatter Structure

Every wiki page must include frontmatter with the following required and optional fields:

```toml
+++
title = "Your Concept Title"
slug = "your-concept"
description = "Brief description for SEO and page previews"
date = 2024-01-15
template = "wiki-page.html"

[extra]
summary = "2-3 sentence summary that appears prominently below the title"
category = "Core Concepts"
alternative_names = [
    "Alternative Name 1",
    "Alternative Spelling",
    "Also Known As"
]
see_also = [
    { title = "Related Page", path = "wiki/related-page/", description = "Optional description" }
]
external_links = [
    { title = "External Resource", url = "https://example.com", description = "What this link provides" }
]
references = [
    { title = "Source Title", author = "Author Name", publication = "Publisher", date = "2024", description = "Why this source is relevant" }
]
+++
```

## Frontmatter Fields Explained

### Required Fields

- **title**: The main title of the wiki entry
- **slug**: URL-friendly version of the title
- **template**: Must be set to `"wiki-page.html"`

### Recommended Fields

- **description**: Brief description used for SEO and previews
- **date**: Last updated date (affects sorting and display)
- **summary**: Prominent summary displayed below the title

### Optional Fields

- **category**: Groups related pages together
- **alternative_names**: Array of alternative names, spellings, or translations
- **see_also**: Array of related internal pages
- **external_links**: Array of external resources
- **references**: Array of academic or source references

## Content Structure

### Heading Hierarchy

Use a clear heading structure for automatic table of contents generation:

```markdown
## Major Section (H2)

Content for this major section...

### Subsection (H3)

More detailed information...

#### Minor Point (H4)

Specific details or examples...
```

The table of contents will automatically generate from H2, H3, and H4 headings.

### Management Summary

The summary field in frontmatter creates a prominent overview section that appears immediately after the title. This should be 2-3 sentences that explain:

1. What the concept is
2. Why it's important
3. How it relates to the main hypothesis

## Advanced Content Features

### Info Boxes

Use info boxes to highlight important information:

```markdown
{% info(type="info", title="Important Context") %}
This provides additional context that readers should be aware of when understanding this concept.
{% end %}

{% info(type="warning", title="Caution") %}
This highlights potential misconceptions or areas where readers should be careful.
{% end %}

{% info(type="success", title="Key Insight") %}
This emphasizes breakthrough moments or important conclusions.
{% end %}
```

Available types: `info`, `warning`, `danger`, `success`

### Definition Boxes

For key terminology, use definition boxes:

```markdown
{% definition(term="Technical Term", type="scientific") %}
Clear, precise definition of the term that readers can easily understand and reference.
{% end %}
```

Available types: `standard`, `scientific`, `historical`, `technical`, `philosophical`

### Citations and References

#### Inline Citations

Use the reference shortcode for clean inline citations:

```markdown
This claim is supported by research {{ reference(key="1", text="Smith 2024") }}.
```

#### Footnotes

Standard markdown footnotes work seamlessly:

```markdown
This statement needs clarification[^1].

[^1]: This is the footnote text that appears at the bottom of the page.
```

#### Reference Numbers

Link to your references section:

```markdown
According to recent studies {{ reference(number="1") }}, this hypothesis is gaining support.
```

## Best Practices

### Writing Style

1. **Use clear, accessible language** - Avoid unnecessary jargon
2. **Define technical terms** - Use definition boxes for key concepts
3. **Maintain neutral tone** - Present information objectively
4. **Structure logically** - Order information from general to specific
5. **Include context** - Explain why the concept matters

### Content Organization

1. **Start with the summary** - Clear overview in frontmatter
2. **Use consistent headings** - Follow the H2 > H3 > H4 hierarchy
3. **Group related information** - Keep similar concepts together
4. **Cross-reference liberally** - Link to related wiki entries
5. **Cite sources** - Include references for claims and data

### Alternative Names

Include alternative names when:

- The concept has translations in other languages
- Multiple spellings exist in different sources
- The term has evolved over time
- Different authors use different terminology

Example:
```toml
alternative_names = [
    "אֱלֹהִים (Hebrew)",
    "Eloha (singular)",
    "The Powerful Ones",
    "Sky People"
]
```

## Typography and Formatting

### Text Emphasis

- Use **bold** for key terms and important concepts
- Use *italic* for emphasis or foreign terms
- Use `code formatting` for technical terms, file paths, or code

### Lists

Create clear, scannable lists:

```markdown
1. **Numbered lists** for sequential information
2. **Bullet points** for related items
3. **Nested lists** for subcategories
```

### Tables

Use tables for comparative information:

```markdown
| Concept | Definition | Source |
|---------|------------|---------|
| Term 1  | Definition 1 | Source 1 |
| Term 2  | Definition 2 | Source 2 |
```

### Blockquotes

Use blockquotes for important passages or quotes:

```markdown
> This is an important quote that provides key insight into the concept being discussed.
>
> <cite>Author Name, Source Publication</cite>
```

## Technical Implementation

### Template System

The wiki uses a custom Zola template (`wiki-page.html`) that:

- Auto-generates table of contents from headings
- Renders the summary section prominently
- Handles multiple reference types
- Provides responsive layout for all devices
- Includes proper semantic HTML for accessibility

### Styling

The CSS follows BEM methodology with:

- **Semantic class names** (`.wiki__component`)
- **CSS custom properties** for theming
- **Responsive design** principles
- **Accessibility** considerations

### Mobile Optimization

The layout adapts for mobile devices:

- TOC moves below content on small screens
- Typography scales appropriately
- Touch targets are properly sized
- Content remains readable at all sizes

## SEO and Accessibility

### Search Optimization

- Use descriptive titles and slugs
- Include comprehensive descriptions
- Structure content with proper headings
- Use semantic markup for better crawling

### Accessibility Features

- Proper heading hierarchy for screen readers
- Focus indicators for keyboard navigation
- Alt text for images (when applicable)
- High contrast color schemes
- Semantic HTML structure

## Quality Guidelines

### Content Quality

1. **Accuracy**: Verify all factual claims
2. **Completeness**: Cover the topic comprehensively
3. **Clarity**: Use clear, understandable language
4. **Currency**: Keep information up to date

### Style Consistency

1. **Tone**: Maintain encyclopedic, neutral tone
2. **Formatting**: Follow established patterns
3. **Terminology**: Use consistent terms throughout
4. **Citations**: Properly attribute all sources

## Common Patterns

### Scientific Concepts

For scientific topics:

```markdown
## Definition

Clear, technical definition using scientific terminology.

## Scientific Basis

Current research and evidence supporting the concept.

## Implications

What this means for the broader hypothesis.

## Controversies

Areas of debate or conflicting interpretations.
```

### Historical Concepts

For historical topics:

```markdown
## Historical Context

When and where this concept originated.

## Development

How the concept evolved over time.

## Modern Interpretation

Contemporary understanding and analysis.

## Sources

Primary and secondary sources.
```

### Technical Terms

For technical definitions:

```markdown
{% definition(term="Technical Term", type="technical") %}
Precise definition with technical accuracy.
{% end %}

## Applications

How this term is used in context.

## Related Technologies

Connected technical concepts.
```

## Troubleshooting

### Common Issues

1. **TOC not generating**: Check heading structure (H2, H3, H4)
2. **References not linking**: Verify reference numbering
3. **Styling issues**: Ensure proper template selection
4. **Mobile layout problems**: Test responsive breakpoints

### Template Debugging

If pages aren't rendering correctly:

1. Check frontmatter syntax
2. Verify template path
3. Validate markdown syntax
4. Test locally with `zola serve`

This documentation should cover all aspects of creating effective wiki entries. For additional questions or suggestions, refer to the project's contribution guidelines.
