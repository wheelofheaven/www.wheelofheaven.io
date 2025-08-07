# Quote Features Documentation

This document explains the enhanced quote system implemented for the Wheel of Heaven wiki, including author profiles and revelations quotes.

## Overview

The wiki now supports three types of quotes:

1. **Regular Blockquotes** - Standard markdown blockquotes with enhanced styling
2. **Author Quotes** - Blockquotes with curated author profiles and avatars
3. **Revelations Quotes** - Special quotes from Wheel of Heaven revelations with direct links

## Regular Blockquotes

Use standard markdown syntax for regular blockquotes:

```markdown
> This is a regular blockquote with enhanced Spectral font styling.
>
> <cite>Traditional Citation</cite>
```

**Features:**
- Uses Google Fonts **Spectral** for elegant serif typography
- Normalized font size (1rem) that integrates with body text
- Subtle gradient accents and styling
- Support for traditional `<cite>` tags

## Author Quotes with Profiles

Create blockquotes with author profiles using the `author` shortcode:

### Using Curated Authors

```markdown
{% author(author="einstein") %}
Imagination is more important than knowledge. For knowledge is limited, whereas imagination embraces the entire world.
{% end %}
```

### Using Authors with Work/Publication References

```markdown
{% author(author="einstein", work="The World As I See It", year="1949") %}
Imagination is more important than knowledge.
{% end %}
```

### Using Custom Authors

```markdown
{% author(name="Custom Author", title="Example Title", work="Important Work", year="2024", url="https://example.com") %}
This quote is from a custom author not in the database, with work reference and URL.
{% end %}
```

**Features:**
- Round profile pictures with fallback to initials
- Author name, title, and birth/death years
- Work/publication references with optional URLs
- Automatic fallback for missing images
- Elegant author information display

**Parameters:**
- `author` - Author key from database
- `name` - Custom author name (if not in database)
- `title` - Custom author title/profession
- `work` - Title of work/book/publication
- `year` - Year of publication
- `url` - Optional URL to the work (creates clickable link)

## Revelations Quotes

For quotes from Wheel of Heaven revelations, use the `revelation` shortcode:

```markdown
{% revelation(title="The Book Which Tells The Truth", path="revelations/the-book-which-tells-the-truth", book="The Book Which Tells The Truth", chapter="1") %}
In the beginning, the Elohim created the heavens and the earth through advanced scientific methods.
{% end %}
```

**Parameters:**
- `title` - Display name of the book
- `path` - URL path to the revelations section
- `book` - Book name for citation
- `chapter` - Chapter number (optional)
- `verse` - Verse number (optional)

**Features:**
- Frosted glass background with subtle styling
- Compact bottom-right positioned link button
- Automatic citation formatting
- Scroll emoji indicator
- Enhanced readability with softer appearance

## Author Database

Authors are managed in `content/authors.toml`:

```toml
[authors.einstein]
name = "Albert Einstein"
title = "Theoretical Physicist"
birth_year = 1879
death_year = 1955
image = "authors/einstein.jpg"
description = "German-born theoretical physicist who developed the theory of relativity"

[[authors.einstein.works]]
title = "Relativity: The Special and General Theory"
year = 1916
url = "https://www.gutenberg.org/ebooks/5001"

[[authors.einstein.works]]
title = "The World As I See It"
year = 1949
url = ""
```

### Adding New Authors

1. Add entry to `content/authors.toml`
2. Place author image in `static/authors/` directory
3. Use the author key in `{% author(author="key") %}` shortcodes

### Image Requirements

- **Format**: JPG, PNG, or WebP
- **Size**: 200x200px minimum (square aspect ratio)
- **Location**: `static/authors/filename.jpg`
- **Fallback**: System automatically shows initials if image fails

## Styling Features

### Regular Blockquotes
- **Font**: Google Fonts Spectral Regular
- **Size**: 1rem (normalized with body text)
- **Styling**: Enhanced gradient borders with animation
- **Background**: More prominent gradient with 2px animated border

### Author Profiles
- **Avatar**: 2.5rem circular image with hover effects
- **Typography**: 
  - Name: Space Grotesk (lead font)
  - Title: IBM Plex Mono (tech font) uppercase
  - Dates: IBM Plex Mono (tech font) small
  - Work: Body font italic with optional URL links
- **Layout**: Horizontal flex with gap

### Revelations Quotes
- **Background**: Frosted glass with backdrop blur
- **Button**: Compact bottom-right positioned tech-styled button
- **Indicator**: Subtle scroll emoji in top-right corner
- **Styling**: Softer glass appearance with subtle shadows

## Best Practices

### When to Use Each Type

1. **Regular Blockquotes**:
   - General quotes without specific attribution
   - Historical texts or documents
   - When author profile isn't needed

2. **Author Quotes**:
   - Quotes from notable figures
   - When author context adds value
   - Scientific or academic citations

3. **Revelations Quotes**:
   - Direct quotes from Wheel of Heaven books
   - When linking to source text is important
   - Core Raëlian concepts and teachings

### Content Guidelines

- Keep quotes concise and impactful
- Always provide proper attribution
- Use revelations quotes for core concepts
- Add context when necessary

### Technical Notes

- All quote types are fully responsive
- Print styles remove animations and optimize for paper
- Images have automatic fallbacks
- Accessibility features include proper ARIA labels

## Examples in Use

### Scientific Quote with Publication
```markdown
{% author(author="sagan", work="Cosmos", year="1980") %}
The cosmos is within us. We are made of star-stuff. We are a way for the universe to know itself.
{% end %}
```

### Revelations Teaching
```markdown
{% revelation(title="The Message Given To Me By Extra-Terrestrials", path="revelations/the-message", book="The Message", chapter="2") %}
The Elohim are our creators, not gods. They are advanced scientists from another planet who created all life on Earth through genetic engineering.
{% end %}
```

### Traditional Quote
```markdown
> Science is not only compatible with spirituality; it is a profound source of spirituality.
>
> <cite>Carl Sagan</cite>
```

This system provides flexible, visually appealing, and contextually rich quote formatting that enhances the wiki's educational value while maintaining excellent user experience.