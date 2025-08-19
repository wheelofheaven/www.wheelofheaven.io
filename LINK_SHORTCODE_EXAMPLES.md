# Link Shortcode Examples

This file demonstrates how to use the new `link` shortcode in your Markdown files.

## Basic Usage

### Internal Links
For internal links within your site, you can use:

```
{{ link(url="/about", text="About Us") }}
```

### External Links
External links will automatically get the ↗ symbol and proper attributes:

```
{{ link(url="https://github.com/wheelofheaven", text="Our GitHub") }}
```

## Advanced Usage

### With Title Attribute
```
{{ link(url="/wiki/elohim", text="Learn about Elohim", title="Detailed information about the Elohim") }}
```

### With Custom CSS Classes
```
{{ link(url="/important-page", text="Important Page", class="highlight-link") }}
```

### With Custom Target
```
{{ link(url="https://example.com", text="External Site", target="_self") }}
```

## Internationalization (i18n) Handling

The shortcode automatically handles language prefixes for internal links:

### On English pages (`/about`)
```
{{ link(url="/wiki", text="Wiki") }}
```
Result: Links to `/wiki`

### On German pages (`/de/about`)
```
{{ link(url="/wiki", text="Wiki") }}
```
Result: Links to `/de/wiki`

### For relative paths
```
{{ link(url="articles/first-article", text="First Article") }}
```
- On English pages: Links to `/articles/first-article`
- On German pages: Links to `/de/articles/first-article`

### For absolute internal paths that already have language prefix
```
{{ link(url="/de/wiki", text="German Wiki") }}
```
Result: Links to `/de/wiki` (no double prefix added)

## Examples in Context

Here's how you might use the shortcode in actual content:

For more information about our mission, please visit our {{ link(url="/about", text="About page") }}.

You can also check out our {{ link(url="https://github.com/wheelofheaven", text="GitHub repository") }} for the latest updates.

If you're interested in contributing, read our {{ link(url="/contribute", text="contribution guidelines", title="How to contribute to Wheel of Heaven") }}.

## What the Shortcode Does

1. **External Link Detection**: Automatically detects external links and adds:
   - `target="_blank"` attribute
   - `rel="noopener noreferrer"` for security
   - The ↗ symbol at the end of the link text

2. **i18n Support**: For internal links, automatically adds the current language prefix when needed

3. **Clean Syntax**: Provides a clean, semantic way to create links in Markdown

## Migration from Regular Links

### Before (regular Markdown links):
```markdown
[About Us](/about)
[GitHub](https://github.com/wheelofheaven)
```

### After (using shortcode):
```
{{ link(url="/about", text="About Us") }}
{{ link(url="https://github.com/wheelofheaven", text="GitHub") }}
```

The shortcode version provides better i18n support and automatic external link handling.