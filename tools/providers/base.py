"""
Base class for translation providers.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


@dataclass
class TranslationResult:
    """Result of a translation request."""
    text: str
    source_lang: str
    target_lang: str
    provider: str
    model: Optional[str] = None
    tokens_used: Optional[int] = None
    cost_estimate: Optional[float] = None
    raw_response: Optional[dict] = None


class TranslationProvider(ABC):
    """Abstract base class for translation providers."""

    name: str = "base"
    requires_api_key: bool = True
    supports_context: bool = True  # Can use surrounding paragraphs for context

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key
        self.model = model or self.default_model

    @property
    @abstractmethod
    def default_model(self) -> str:
        """Default model to use."""
        pass

    @property
    @abstractmethod
    def available_models(self) -> list[str]:
        """List of available models."""
        pass

    @abstractmethod
    def translate(
        self,
        text: str,
        source_lang: str,
        target_lang: str,
        context: Optional[dict] = None,
    ) -> TranslationResult:
        """
        Translate text from source language to target language.

        Args:
            text: The text to translate
            source_lang: Source language code (e.g., 'fr')
            target_lang: Target language code (e.g., 'en')
            context: Optional context dict with:
                - book_title: Title of the book
                - chapter_title: Title of the chapter
                - previous_paragraph: Previous paragraph text (source)
                - previous_translation: Previous paragraph translation (target)
                - next_paragraph: Next paragraph text (source)
                - speaker: Speaker attribution if any
                - style_notes: Any style guidance

        Returns:
            TranslationResult with the translated text and metadata
        """
        pass

    def translate_batch(
        self,
        texts: list[str],
        source_lang: str,
        target_lang: str,
        contexts: Optional[list[dict]] = None,
    ) -> list[TranslationResult]:
        """
        Translate multiple texts. Default implementation calls translate() for each.
        Override for providers that support batching.
        """
        results = []
        for i, text in enumerate(texts):
            context = contexts[i] if contexts else None
            results.append(self.translate(text, source_lang, target_lang, context))
        return results

    def build_prompt(
        self,
        text: str,
        source_lang: str,
        target_lang: str,
        context: Optional[dict] = None,
    ) -> str:
        """Build the translation prompt with context."""
        lang_names = {
            "en": "English",
            "fr": "French",
            "de": "German",
            "es": "Spanish",
            "ru": "Russian",
            "ja": "Japanese",
            "zh": "Chinese",
            "ko": "Korean",
            "he": "Hebrew",
            "gez": "Ge'ez (Ethiopic)",
        }

        source_name = lang_names.get(source_lang, source_lang)
        target_name = lang_names.get(target_lang, target_lang)

        prompt_parts = [
            f"Translate the following {source_name} text to {target_name}.",
            "",
            "Guidelines:",
            "- Preserve the original meaning and tone",
            "- Maintain religious/philosophical terminology accurately",
            "- Keep proper nouns (names, places) consistent",
            "- Preserve paragraph structure",
        ]

        if context:
            if context.get("book_title"):
                prompt_parts.append(f"- This is from the book: {context['book_title']}")

            if context.get("chapter_title"):
                prompt_parts.append(f"- Chapter: {context['chapter_title']}")

            if context.get("speaker"):
                prompt_parts.append(f"- Speaker: {context['speaker']}")

            if context.get("style_notes"):
                prompt_parts.append(f"- Style: {context['style_notes']}")

            if context.get("previous_translation"):
                prompt_parts.extend([
                    "",
                    "Previous paragraph (for context):",
                    f"[{source_name}] {context.get('previous_paragraph', '')}",
                    f"[{target_name}] {context.get('previous_translation', '')}",
                ])

        prompt_parts.extend([
            "",
            "Text to translate:",
            f"---",
            text,
            f"---",
            "",
            f"Provide only the {target_name} translation, without any additional commentary:",
        ])

        return "\n".join(prompt_parts)

    def is_available(self) -> bool:
        """Check if this provider is available (dependencies installed, API key set)."""
        return True

    def validate_config(self) -> tuple[bool, str]:
        """Validate provider configuration. Returns (is_valid, error_message)."""
        if self.requires_api_key and not self.api_key:
            return False, f"API key required for {self.name}. Set {self.env_var_name} environment variable."
        return True, ""

    @property
    def env_var_name(self) -> str:
        """Environment variable name for API key."""
        return f"{self.name.upper()}_API_KEY"
