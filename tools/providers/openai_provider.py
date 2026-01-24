"""
OpenAI translation provider.
"""

import os
from typing import Optional

from .base import TranslationProvider, TranslationResult


class OpenAIProvider(TranslationProvider):
    """Translation provider using OpenAI's API."""

    name = "openai"
    requires_api_key = True
    supports_context = True

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        api_key = api_key or os.environ.get("OPENAI_API_KEY")
        super().__init__(api_key=api_key, model=model)
        self._client = None

    @property
    def default_model(self) -> str:
        return "gpt-4o"

    @property
    def available_models(self) -> list[str]:
        return [
            "gpt-4o",
            "gpt-4o-mini",
            "gpt-4-turbo",
            "gpt-3.5-turbo",
        ]

    @property
    def env_var_name(self) -> str:
        return "OPENAI_API_KEY"

    def is_available(self) -> bool:
        try:
            import openai  # noqa: F401
            return True
        except ImportError:
            return False

    def _get_client(self):
        if self._client is None:
            try:
                import openai
                self._client = openai.OpenAI(api_key=self.api_key)
            except ImportError:
                raise RuntimeError(
                    "openai package not installed. Run: uv pip install 'woh-tools[openai]'"
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

        response = client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": "You are a professional translator specializing in religious and philosophical texts. Provide accurate, nuanced translations."
                },
                {"role": "user", "content": prompt}
            ],
            max_tokens=4096,
            temperature=0.3,  # Lower temperature for more consistent translations
        )

        translated_text = response.choices[0].message.content.strip()

        # Token usage
        input_tokens = response.usage.prompt_tokens
        output_tokens = response.usage.completion_tokens
        total_tokens = response.usage.total_tokens

        # Rough cost estimate (GPT-4o pricing as of 2024)
        # $5/1M input, $15/1M output
        cost_estimate = (input_tokens * 5 + output_tokens * 15) / 1_000_000

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
                "finish_reason": response.choices[0].finish_reason,
            },
        )
