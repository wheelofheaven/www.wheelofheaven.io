"""
DeepL translation provider.
"""

import os
from typing import Optional

from .base import TranslationProvider, TranslationResult


class DeepLProvider(TranslationProvider):
    """Translation provider using DeepL API."""

    name = "deepl"
    requires_api_key = True
    supports_context = False  # DeepL doesn't support custom prompts/context

    # DeepL language code mappings
    LANG_MAP = {
        "en": "EN-US",  # or EN-GB
        "fr": "FR",
        "de": "DE",
        "es": "ES",
        "ru": "RU",
        "ja": "JA",
        "zh": "ZH-HANS",  # Simplified Chinese
        "ko": "KO",
        "pt": "PT-BR",  # or PT-PT
        "it": "IT",
        "nl": "NL",
        "pl": "PL",
    }

    # Languages DeepL can translate FROM
    SOURCE_LANGS = {"en", "fr", "de", "es", "ru", "ja", "zh", "ko", "pt", "it", "nl", "pl"}

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        api_key = api_key or os.environ.get("DEEPL_API_KEY")
        super().__init__(api_key=api_key, model=model)
        self._translator = None

    @property
    def default_model(self) -> str:
        return "default"  # DeepL doesn't have model selection

    @property
    def available_models(self) -> list[str]:
        return ["default"]

    @property
    def env_var_name(self) -> str:
        return "DEEPL_API_KEY"

    def is_available(self) -> bool:
        try:
            import deepl  # noqa: F401
            return True
        except ImportError:
            return False

    def _get_translator(self):
        if self._translator is None:
            try:
                import deepl
                self._translator = deepl.Translator(self.api_key)
            except ImportError:
                raise RuntimeError(
                    "deepl package not installed. Run: uv pip install 'woh-tools[deepl]'"
                )
        return self._translator

    def validate_config(self) -> tuple[bool, str]:
        """Validate DeepL configuration."""
        valid, msg = super().validate_config()
        if not valid:
            return valid, msg

        if not self.is_available():
            return False, "deepl package not installed"

        try:
            translator = self._get_translator()
            # Check usage to verify API key
            translator.get_usage()
            return True, ""
        except Exception as e:
            return False, f"DeepL API error: {e}"

    def _map_language(self, lang: str, is_source: bool = False) -> str:
        """Map our language codes to DeepL codes."""
        if is_source:
            # Source languages use simple codes
            return lang.upper()
        # Target languages may need specific variants
        return self.LANG_MAP.get(lang, lang.upper())

    def translate(
        self,
        text: str,
        source_lang: str,
        target_lang: str,
        context: Optional[dict] = None,
    ) -> TranslationResult:
        # Check language support
        if source_lang not in self.SOURCE_LANGS:
            raise ValueError(f"DeepL doesn't support source language: {source_lang}")

        if target_lang not in self.LANG_MAP:
            raise ValueError(f"DeepL doesn't support target language: {target_lang}")

        translator = self._get_translator()

        deepl_source = self._map_language(source_lang, is_source=True)
        deepl_target = self._map_language(target_lang, is_source=False)

        result = translator.translate_text(
            text,
            source_lang=deepl_source,
            target_lang=deepl_target,
            preserve_formatting=True,
            formality="default",  # Could make this configurable
        )

        translated_text = result.text

        # DeepL doesn't provide detailed token counts
        # Rough cost estimate based on character count
        # DeepL Pro: ~$20/1M characters
        char_count = len(text)
        cost_estimate = (char_count * 20) / 1_000_000

        return TranslationResult(
            text=translated_text,
            source_lang=source_lang,
            target_lang=target_lang,
            provider=self.name,
            model="deepl",
            tokens_used=None,
            cost_estimate=cost_estimate,
            raw_response={
                "detected_source_lang": result.detected_source_lang,
                "char_count": char_count,
            },
        )

    def translate_batch(
        self,
        texts: list[str],
        source_lang: str,
        target_lang: str,
        contexts: Optional[list[dict]] = None,
    ) -> list[TranslationResult]:
        """DeepL supports efficient batch translation."""
        translator = self._get_translator()

        deepl_source = self._map_language(source_lang, is_source=True)
        deepl_target = self._map_language(target_lang, is_source=False)

        results = translator.translate_text(
            texts,
            source_lang=deepl_source,
            target_lang=deepl_target,
            preserve_formatting=True,
        )

        translation_results = []
        for i, result in enumerate(results):
            char_count = len(texts[i])
            cost_estimate = (char_count * 20) / 1_000_000

            translation_results.append(TranslationResult(
                text=result.text,
                source_lang=source_lang,
                target_lang=target_lang,
                provider=self.name,
                model="deepl",
                tokens_used=None,
                cost_estimate=cost_estimate,
                raw_response={
                    "detected_source_lang": result.detected_source_lang,
                    "char_count": char_count,
                },
            ))

        return translation_results

    def get_usage(self) -> dict:
        """Get DeepL API usage statistics."""
        translator = self._get_translator()
        usage = translator.get_usage()
        return {
            "character_count": usage.character.count if usage.character else 0,
            "character_limit": usage.character.limit if usage.character else 0,
        }
