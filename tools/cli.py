"""
Wheel of Heaven CLI - Library management tools.

Usage:
    woh translate status [BOOK]      Show translation status
    woh translate edit BOOK REF      Edit a specific translation
    woh translate export BOOK LANG   Export translations for a language
    woh translate import FILE        Import translations from file
    woh catalog list                 List all books in catalog
    woh catalog validate             Validate catalog and book data
"""

import click

from .translate import translate_group
from .catalog import catalog_group


@click.group()
@click.version_option(version="0.1.0", prog_name="woh")
def main():
    """Wheel of Heaven library management CLI."""
    pass


main.add_command(translate_group, name="translate")
main.add_command(catalog_group, name="catalog")


if __name__ == "__main__":
    main()
