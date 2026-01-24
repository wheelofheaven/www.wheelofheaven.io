"""
Claude (Anthropic) translation provider.
"""

import os
from typing import Optional

from .base import TranslationProvider, TranslationResult


class ClaudeProvider(TranslationProvider):
    """Translation provider using Anthropic's Claude API."""

    name = "claude"
    requires_api_key = True
    supports_context = True

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        api_key = api_key or os.environ.get("ANTHROPIC_API_KEY")
        super().__init__(api_key=api_key, model=model)
        self._client = None

    @property
    def default_model(self) -> str:
        return "claude-sonnet-4-20250514"

    @property
    def available_models(self) -> list[str]:
        return [
            "claude-sonnet-4-20250514",
            "claude-opus-4-20250514",
            "claude-3-5-haiku-20241022",
        ]

    @property
    def env_var_name(self) -> str:
        return "ANTHROPIC_API_KEY"

    def is_available(self) -> bool:
        try:
            import anthropic  # noqa: F401
            return True
        except ImportError:
            return False

    def _get_client(self):
        if self._client is None:
            try:
                import anthropic
                self._client = anthropic.Anthropic(api_key=self.api_key)
            except ImportError:
                raise RuntimeError(
                    "anthropic package not installed. Run: uv pip install 'woh-tools[claude]'"
                )
        return self._client

    def translate(
        self,
        text: str,
        source_lang: str,
        target_lang: str,
        context: Optional[dict] = None,
    ) -> TranslationResult:
        client = self._get_client()

        prompt = self.build_prompt(text, source_lang, target_lang, context)

        response = client.messages.create(
            model=self.model,
            max_tokens=4096,
            messages=[
                {"role": "user", "content": prompt}
            ],
        )

        translated_text = response.content[0].text.strip()

        # Calculate token usage
        input_tokens = response.usage.input_tokens
        output_tokens = response.usage.output_tokens
        total_tokens = input_tokens + output_tokens

        # Rough cost estimate (as of 2024, Claude 3.5 Sonnet pricing)
        # $3/1M input, $15/1M output
        cost_estimate = (input_tokens * 3 + output_tokens * 15) / 1_000_000

        return TranslationResult(
            text=translated_text,
            source_lang=source_lang,
            target_lang=target_lang,
            provider=self.name,
            model=self.model,
            tokens_used=total_tokens,
            cost_estimate=cost_estimate,
            raw_response={
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "stop_reason": response.stop_reason,
            },
        )
