"""
Translation management commands.
"""

import json
import os
import tempfile
import subprocess
from datetime import datetime, timezone
from pathlib import Path

import click
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.syntax import Syntax
from rich.progress import Progress, SpinnerColumn, TextColumn

from .library import (
    get_library_path,
    load_catalog,
    load_book,
    save_book,
    get_book_entry,
    iterate_paragraphs,
)

console = Console()


@click.group()
def translate_group():
    """Translation management commands."""
    pass


@translate_group.command("status")
@click.argument("book", required=False)
@click.option("--lang", "-l", help="Filter by language")
def status(book: str | None, lang: str | None):
    """Show translation status for books.

    If BOOK is provided, shows detailed paragraph-level status.
    Otherwise shows summary for all books.
    """
    catalog = load_catalog()

    if book:
        show_book_status(book, catalog, lang)
    else:
        show_catalog_status(catalog, lang)


def show_catalog_status(catalog: dict, lang_filter: str | None):
    """Show translation status summary for all books."""
    table = Table(title="Translation Status")
    table.add_column("Book", style="cyan")
    table.add_column("Code", style="dim")
    table.add_column("Primary", style="green")
    table.add_column("Languages", style="yellow")
    table.add_column("Paragraphs", justify="right")
    table.add_column("Status", style="magenta")

    for book_entry in catalog.get("books", []):
        if book_entry.get("status") == "planned":
            continue

        langs = book_entry.get("availableLangs", [])
        complete = book_entry.get("completeLangs", [])

        lang_display = []
        for l in langs:
            if l in complete:
                lang_display.append(f"[green]{l}[/green]")
            else:
                lang_display.append(f"[yellow]{l}[/yellow]")

        table.add_row(
            book_entry.get("slug", "")[:30],
            book_entry.get("code", ""),
            book_entry.get("primaryLang", ""),
            " ".join(lang_display),
            str(book_entry.get("paragraphs", 0)),
            book_entry.get("status", ""),
        )

    console.print(table)
    console.print("\n[green]■[/green] Complete  [yellow]■[/yellow] Partial")


def show_book_status(book_slug: str, catalog: dict, lang_filter: str | None):
    """Show detailed translation status for a specific book."""
    book_entry = get_book_entry(catalog, book_slug)
    if not book_entry:
        console.print(f"[red]Book '{book_slug}' not found in catalog[/red]")
        return

    book_data = load_book(book_slug)
    if not book_data:
        console.print(f"[red]Could not load book data for '{book_slug}'[/red]")
        return

    # Determine languages to check
    primary_lang = book_data.get("primaryLang", "fr")
    if lang_filter:
        langs_to_check = [lang_filter]
    else:
        langs_to_check = book_entry.get("availableLangs", [])
        if primary_lang in langs_to_check:
            langs_to_check.remove(primary_lang)

    # Count translations per chapter
    table = Table(title=f"Translation Status: {book_slug}")
    table.add_column("Chapter", style="cyan")
    table.add_column("Title")
    table.add_column("Paragraphs", justify="right")

    for lang in langs_to_check:
        table.add_column(lang.upper(), justify="right", style="yellow")

    total_paras = 0
    total_by_lang = {lang: 0 for lang in langs_to_check}

    chapters = book_data.get("chapters", [])
    for chapter in chapters:
        chapter_num = chapter.get("n", 0)
        chapter_title = chapter.get("title", f"Chapter {chapter_num}")[:25]
        paragraphs = chapter.get("paragraphs", [])
        para_count = len(paragraphs)
        total_paras += para_count

        lang_counts = {}
        for lang in langs_to_check:
            count = sum(
                1 for p in paragraphs
                if p.get("i18n", {}).get(lang, "").strip()
            )
            lang_counts[lang] = count
            total_by_lang[lang] += count

        row = [str(chapter_num), chapter_title, str(para_count)]
        for lang in langs_to_check:
            count = lang_counts[lang]
            pct = (count / para_count * 100) if para_count > 0 else 0
            if pct == 100:
                row.append(f"[green]{count}[/green]")
            elif pct > 0:
                row.append(f"[yellow]{count}[/yellow]")
            else:
                row.append(f"[red]0[/red]")

        table.add_row(*row)

    # Add totals row
    row = ["", "[bold]TOTAL[/bold]", f"[bold]{total_paras}[/bold]"]
    for lang in langs_to_check:
        count = total_by_lang[lang]
        pct = (count / total_paras * 100) if total_paras > 0 else 0
        row.append(f"[bold]{count}[/bold] ({pct:.0f}%)")
    table.add_row(*row)

    console.print(table)


@translate_group.command("edit")
@click.argument("book")
@click.argument("ref")
@click.option("--lang", "-l", required=True, help="Target language code")
def edit(book: str, ref: str, lang: str):
    """Edit a specific paragraph translation.

    REF can be in format: 1:5 or TBWTT-1:5 or c1p5
    """
    book_data = load_book(book)
    if not book_data:
        console.print(f"[red]Could not load book '{book}'[/red]")
        return

    # Parse reference
    chapter_num, para_num = parse_reference(ref)
    if chapter_num is None:
        console.print(f"[red]Invalid reference format: {ref}[/red]")
        console.print("Use format: 1:5, TBWTT-1:5, or c1p5")
        return

    # Find paragraph
    chapters = book_data.get("chapters", [])
    chapter = next((c for c in chapters if c.get("n") == chapter_num), None)
    if not chapter:
        console.print(f"[red]Chapter {chapter_num} not found[/red]")
        return

    paragraphs = chapter.get("paragraphs", [])
    para = next((p for p in paragraphs if p.get("n") == para_num), None)
    if not para:
        console.print(f"[red]Paragraph {para_num} not found in chapter {chapter_num}[/red]")
        return

    # Show original text
    primary_lang = book_data.get("primaryLang", "fr")
    original = para.get("text", "")
    current_translation = para.get("i18n", {}).get(lang, "")

    console.print(Panel(
        original,
        title=f"Original ({primary_lang.upper()})",
        border_style="blue"
    ))

    if current_translation:
        console.print(Panel(
            current_translation,
            title=f"Current Translation ({lang.upper()})",
            border_style="yellow"
        ))

    # Open editor
    new_translation = edit_in_editor(current_translation, original, lang)

    if new_translation is None:
        console.print("[yellow]Edit cancelled[/yellow]")
        return

    if new_translation == current_translation:
        console.print("[yellow]No changes made[/yellow]")
        return

    # Update and save
    if "i18n" not in para:
        para["i18n"] = {}
    para["i18n"][lang] = new_translation

    if save_book(book, book_data):
        console.print(f"[green]✓ Updated {book} {chapter_num}:{para_num} ({lang})[/green]")
    else:
        console.print("[red]Failed to save changes[/red]")


def edit_in_editor(current: str, original: str, lang: str) -> str | None:
    """Open text in $EDITOR for editing."""
    editor = os.environ.get("EDITOR", "vim")

    # Create temp file with context
    with tempfile.NamedTemporaryFile(mode="w", suffix=f".{lang}.txt", delete=False) as f:
        f.write(f"# Translation to {lang.upper()}\n")
        f.write(f"# Original text below (do not edit):\n")
        f.write(f"# ---\n")
        for line in original.split("\n"):
            f.write(f"# {line}\n")
        f.write(f"# ---\n")
        f.write(f"# Enter translation below:\n\n")
        f.write(current)
        temp_path = f.name

    try:
        subprocess.run([editor, temp_path], check=True)

        with open(temp_path, "r") as f:
            content = f.read()

        # Extract translation (skip comment lines)
        lines = []
        past_header = False
        for line in content.split("\n"):
            if line.startswith("# Enter translation below:"):
                past_header = True
                continue
            if past_header and not line.startswith("#"):
                lines.append(line)

        return "\n".join(lines).strip()
    except subprocess.CalledProcessError:
        return None
    finally:
        os.unlink(temp_path)


@translate_group.command("export")
@click.argument("book")
@click.argument("lang")
@click.option("--format", "-f", "fmt", type=click.Choice(["json", "tsv"]), default="json")
@click.option("--output", "-o", type=click.Path(), help="Output file path")
@click.option("--missing-only", is_flag=True, help="Only export paragraphs missing translation")
def export_translations(book: str, lang: str, fmt: str, output: str | None, missing_only: bool):
    """Export translations for editing externally.

    Exports to JSON (for reimport) or TSV (for spreadsheets).
    """
    book_data = load_book(book)
    if not book_data:
        console.print(f"[red]Could not load book '{book}'[/red]")
        return

    primary_lang = book_data.get("primaryLang", "fr")
    entries = []

    for chapter, para in iterate_paragraphs(book_data):
        chapter_num = chapter.get("n", 0)
        para_num = para.get("n", 0)
        original = para.get("text", "")
        translation = para.get("i18n", {}).get(lang, "")

        if missing_only and translation.strip():
            continue

        entries.append({
            "ref": f"{chapter_num}:{para_num}",
            "refId": para.get("refId", f"c{chapter_num}p{para_num}"),
            "original": original,
            "translation": translation,
        })

    if not entries:
        console.print("[yellow]No entries to export[/yellow]")
        return

    # Generate output
    if fmt == "json":
        export_data = {
            "book": book,
            "primaryLang": primary_lang,
            "targetLang": lang,
            "exported": datetime.now(timezone.utc).isoformat(),
            "entries": entries,
        }
        content = json.dumps(export_data, indent=2, ensure_ascii=False)
        ext = ".json"
    else:  # tsv
        lines = ["ref\trefId\toriginal\ttranslation"]
        for e in entries:
            orig = e["original"].replace("\t", " ").replace("\n", "\\n")
            trans = e["translation"].replace("\t", " ").replace("\n", "\\n")
            lines.append(f"{e['ref']}\t{e['refId']}\t{orig}\t{trans}")
        content = "\n".join(lines)
        ext = ".tsv"

    # Write output
    if output:
        out_path = Path(output)
    else:
        out_path = Path(f"{book}_{lang}{ext}")

    out_path.write_text(content, encoding="utf-8")
    console.print(f"[green]✓ Exported {len(entries)} entries to {out_path}[/green]")


@translate_group.command("import")
@click.argument("file", type=click.Path(exists=True))
@click.option("--dry-run", is_flag=True, help="Preview changes without saving")
def import_translations(file: str, dry_run: bool):
    """Import translations from an export file.

    Supports JSON format exported by 'woh translate export'.
    """
    file_path = Path(file)

    try:
        data = json.loads(file_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        console.print(f"[red]Invalid JSON: {e}[/red]")
        return

    book_slug = data.get("book")
    target_lang = data.get("targetLang")
    entries = data.get("entries", [])

    if not book_slug or not target_lang:
        console.print("[red]Missing 'book' or 'targetLang' in import file[/red]")
        return

    book_data = load_book(book_slug)
    if not book_data:
        console.print(f"[red]Could not load book '{book_slug}'[/red]")
        return

    # Build lookup for quick access
    para_lookup = {}
    for chapter in book_data.get("chapters", []):
        for para in chapter.get("paragraphs", []):
            ref = f"{chapter.get('n')}:{para.get('n')}"
            para_lookup[ref] = para

    # Apply translations
    updated = 0
    skipped = 0

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        task = progress.add_task("Importing...", total=len(entries))

        for entry in entries:
            ref = entry.get("ref")
            translation = entry.get("translation", "").strip()

            progress.update(task, advance=1, description=f"Processing {ref}")

            if not translation:
                skipped += 1
                continue

            para = para_lookup.get(ref)
            if not para:
                console.print(f"[yellow]Warning: {ref} not found, skipping[/yellow]")
                skipped += 1
                continue

            current = para.get("i18n", {}).get(target_lang, "")
            if translation != current:
                if "i18n" not in para:
                    para["i18n"] = {}
                para["i18n"][target_lang] = translation
                updated += 1

    console.print(f"\nUpdated: {updated}, Skipped: {skipped}")

    if dry_run:
        console.print("[yellow]Dry run - no changes saved[/yellow]")
    else:
        if updated > 0:
            if save_book(book_slug, book_data):
                console.print(f"[green]✓ Saved changes to {book_slug}[/green]")
            else:
                console.print("[red]Failed to save changes[/red]")


@translate_group.command("missing")
@click.argument("book")
@click.argument("lang")
@click.option("--limit", "-n", default=10, help="Number of paragraphs to show")
def show_missing(book: str, lang: str, limit: int):
    """Show paragraphs missing translation."""
    book_data = load_book(book)
    if not book_data:
        console.print(f"[red]Could not load book '{book}'[/red]")
        return

    missing = []
    for chapter, para in iterate_paragraphs(book_data):
        translation = para.get("i18n", {}).get(lang, "").strip()
        if not translation:
            missing.append((chapter, para))

    if not missing:
        console.print(f"[green]✓ All paragraphs have {lang.upper()} translations![/green]")
        return

    console.print(f"[yellow]Found {len(missing)} paragraphs missing {lang.upper()} translation[/yellow]\n")

    for chapter, para in missing[:limit]:
        ref = f"{chapter.get('n')}:{para.get('n')}"
        original = para.get("text", "")[:100]
        if len(para.get("text", "")) > 100:
            original += "..."

        console.print(f"[cyan]{ref}[/cyan] {original}")

    if len(missing) > limit:
        console.print(f"\n... and {len(missing) - limit} more")

    console.print(f"\nTo edit: [dim]woh translate edit {book} <ref> -l {lang}[/dim]")


def parse_reference(ref: str) -> tuple[int | None, int | None]:
    """Parse a paragraph reference into (chapter, paragraph)."""
    import re

    # Format: 1:5
    match = re.match(r"^(\d+):(\d+)$", ref)
    if match:
        return int(match.group(1)), int(match.group(2))

    # Format: TBWTT-1:5 or CODE-1:5
    match = re.match(r"^[A-Za-z]+-(\d+):(\d+)$", ref)
    if match:
        return int(match.group(1)), int(match.group(2))

    # Format: c1p5
    match = re.match(r"^c(\d+)p(\d+)$", ref, re.IGNORECASE)
    if match:
        return int(match.group(1)), int(match.group(2))

    return None, None


# =============================================================================
# LLM-assisted translation commands
# =============================================================================


@translate_group.command("providers")
def list_providers():
    """List available translation providers and their status."""
    try:
        from .providers.registry import get_provider_info, list_providers as get_providers
    except ImportError as e:
        console.print(f"[red]Could not load providers: {e}[/red]")
        return

    providers = get_providers()

    if not providers:
        console.print("[yellow]No translation providers available[/yellow]")
        console.print("Install with: uv pip install 'woh-tools[all-llm]'")
        return

    table = Table(title="Translation Providers")
    table.add_column("Provider", style="cyan")
    table.add_column("Available", style="green")
    table.add_column("Configured", style="yellow")
    table.add_column("API Key Env", style="dim")
    table.add_column("Default Model")
    table.add_column("Context", style="magenta")

    for info in get_provider_info():
        available = "✓" if info["available"] else "✗"
        available_style = "green" if info["available"] else "red"

        configured = "✓" if info["configured"] else "✗"
        configured_style = "green" if info["configured"] else "red"

        env_var = info.get("env_var", "-") or "-"
        model = info.get("default_model", "-") or "-"
        context = "✓" if info.get("supports_context") else "-"

        table.add_row(
            info["name"],
            f"[{available_style}]{available}[/{available_style}]",
            f"[{configured_style}]{configured}[/{configured_style}]",
            env_var,
            model,
            context,
        )

        if info.get("error"):
            table.add_row("", "", f"[dim red]{info['error'][:40]}[/dim red]", "", "", "")

    console.print(table)
    console.print("\n[dim]Install: uv pip install 'woh-tools[provider]' (e.g., claude, openai, ollama, deepl)[/dim]")


@translate_group.command("auto")
@click.argument("book")
@click.option("--lang", "-l", required=True, help="Target language code")
@click.option(
    "--provider", "-p",
    default="claude",
    type=click.Choice(["claude", "openai", "ollama", "deepl"]),
    help="Translation provider"
)
@click.option("--model", "-m", help="Model to use (provider-specific)")
@click.option("--ref", help="Specific reference to translate (e.g., 1:5)")
@click.option("--chapter", "-c", type=int, help="Translate entire chapter")
@click.option("--batch", is_flag=True, help="Translate all missing paragraphs")
@click.option("--limit", "-n", type=int, default=10, help="Max paragraphs to translate in batch mode")
@click.option("--dry-run", is_flag=True, help="Preview translation without saving")
@click.option("--review", is_flag=True, help="Review each translation before saving")
@click.option("--api-key", envvar="TRANSLATION_API_KEY", help="API key (or use provider env var)")
def auto_translate(
    book: str,
    lang: str,
    provider: str,
    model: str | None,
    ref: str | None,
    chapter: int | None,
    batch: bool,
    limit: int,
    dry_run: bool,
    review: bool,
    api_key: str | None,
):
    """Translate paragraphs using an LLM provider.

    Examples:

        # Translate a single paragraph
        woh translate auto my-book -l de --ref 1:5

        # Translate an entire chapter
        woh translate auto my-book -l de --chapter 3

        # Translate all missing paragraphs (up to limit)
        woh translate auto my-book -l de --batch

        # Use a specific provider and model
        woh translate auto my-book -l de --ref 1:5 -p openai -m gpt-4-turbo

        # Review each translation before saving
        woh translate auto my-book -l de --batch --review
    """
    # Load provider
    try:
        from .providers.registry import get_provider
    except ImportError:
        console.print("[red]Provider module not available. Install dependencies:[/red]")
        console.print(f"  uv pip install 'woh-tools[{provider}]'")
        return

    try:
        translator = get_provider(provider, api_key=api_key, model=model)
    except ValueError as e:
        console.print(f"[red]{e}[/red]")
        return

    # Load book
    book_data = load_book(book)
    if not book_data:
        console.print(f"[red]Could not load book '{book}'[/red]")
        return

    catalog = load_catalog()
    book_entry = get_book_entry(catalog, book)
    primary_lang = book_data.get("primaryLang", "fr")

    # Build context for translation
    base_context = {
        "book_title": book_data.get("title", book),
        "book_author": book_entry.get("author") if book_entry else None,
        "tradition": book_entry.get("tradition") if book_entry else None,
        "primary_lang": primary_lang,
    }

    # Determine what to translate
    paragraphs_to_translate = []

    if ref:
        # Single paragraph
        chapter_num, para_num = parse_reference(ref)
        if chapter_num is None:
            console.print(f"[red]Invalid reference: {ref}[/red]")
            return

        chapter_data = next((c for c in book_data.get("chapters", []) if c.get("n") == chapter_num), None)
        if not chapter_data:
            console.print(f"[red]Chapter {chapter_num} not found[/red]")
            return

        para = next((p for p in chapter_data.get("paragraphs", []) if p.get("n") == para_num), None)
        if not para:
            console.print(f"[red]Paragraph {para_num} not found in chapter {chapter_num}[/red]")
            return

        paragraphs_to_translate.append((chapter_data, para))

    elif chapter is not None:
        # Entire chapter
        chapter_data = next((c for c in book_data.get("chapters", []) if c.get("n") == chapter), None)
        if not chapter_data:
            console.print(f"[red]Chapter {chapter} not found[/red]")
            return

        for para in chapter_data.get("paragraphs", []):
            translation = para.get("i18n", {}).get(lang, "").strip()
            if not translation:
                paragraphs_to_translate.append((chapter_data, para))

        if not paragraphs_to_translate:
            console.print(f"[green]✓ Chapter {chapter} is fully translated to {lang.upper()}[/green]")
            return

    elif batch:
        # All missing paragraphs
        for chap, para in iterate_paragraphs(book_data):
            translation = para.get("i18n", {}).get(lang, "").strip()
            if not translation:
                paragraphs_to_translate.append((chap, para))
                if len(paragraphs_to_translate) >= limit:
                    break

        if not paragraphs_to_translate:
            console.print(f"[green]✓ All paragraphs are translated to {lang.upper()}![/green]")
            return

    else:
        console.print("[red]Specify --ref, --chapter, or --batch[/red]")
        return

    console.print(f"[cyan]Translating {len(paragraphs_to_translate)} paragraph(s) to {lang.upper()}[/cyan]")
    console.print(f"[dim]Provider: {provider} | Model: {translator.model}[/dim]\n")

    # Translate
    translated_count = 0
    skipped_count = 0
    total_cost = 0.0

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console,
    ) as progress:
        task = progress.add_task("Translating...", total=len(paragraphs_to_translate))

        for chapter_data, para in paragraphs_to_translate:
            ref_str = f"{chapter_data.get('n')}:{para.get('n')}"
            progress.update(task, description=f"Translating {ref_str}")

            original = para.get("text", "")
            if not original.strip():
                progress.advance(task)
                skipped_count += 1
                continue

            # Build paragraph-specific context
            context = base_context.copy()
            context["chapter_title"] = chapter_data.get("title", "")
            context["chapter_num"] = chapter_data.get("n")
            context["paragraph_num"] = para.get("n")

            # Check for speaker info
            if para.get("speaker"):
                context["speaker"] = para["speaker"]

            try:
                result = translator.translate(
                    text=original,
                    source_lang=primary_lang,
                    target_lang=lang,
                    context=context,
                )

                translation = result.text
                if result.cost_estimate:
                    total_cost += result.cost_estimate

            except Exception as e:
                console.print(f"\n[red]Error translating {ref_str}: {e}[/red]")
                progress.advance(task)
                skipped_count += 1
                continue

            # Display result
            if review or dry_run or len(paragraphs_to_translate) == 1:
                progress.stop()
                console.print(f"\n[cyan]── {ref_str} ──[/cyan]")
                console.print(Panel(original, title=f"Original ({primary_lang.upper()})", border_style="blue"))
                console.print(Panel(translation, title=f"Translation ({lang.upper()})", border_style="green"))

                if review and not dry_run:
                    choice = click.prompt(
                        "Accept? [y]es, [e]dit, [s]kip, [q]uit",
                        type=click.Choice(["y", "e", "s", "q"]),
                        default="y",
                    )

                    if choice == "q":
                        console.print("[yellow]Stopped by user[/yellow]")
                        break
                    elif choice == "s":
                        skipped_count += 1
                        progress.start()
                        progress.advance(task)
                        continue
                    elif choice == "e":
                        translation = edit_in_editor(translation, original, lang)
                        if translation is None:
                            skipped_count += 1
                            progress.start()
                            progress.advance(task)
                            continue

                progress.start()

            # Save translation
            if not dry_run:
                if "i18n" not in para:
                    para["i18n"] = {}
                para["i18n"][lang] = translation
                translated_count += 1

            progress.advance(task)

    # Save book
    if not dry_run and translated_count > 0:
        if save_book(book, book_data):
            console.print(f"\n[green]✓ Saved {translated_count} translation(s)[/green]")
        else:
            console.print("\n[red]Failed to save translations[/red]")
    elif dry_run:
        console.print(f"\n[yellow]Dry run: {translated_count} would be saved[/yellow]")

    # Summary
    if skipped_count > 0:
        console.print(f"[dim]Skipped: {skipped_count}[/dim]")

    if total_cost > 0:
        console.print(f"[dim]Estimated cost: ${total_cost:.4f}[/dim]")
