"""
Ollama (local) translation provider.
"""

import os
from typing import Optional

from .base import TranslationProvider, TranslationResult


class OllamaProvider(TranslationProvider):
    """Translation provider using local Ollama models."""

    name = "ollama"
    requires_api_key = False
    supports_context = True

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        host: Optional[str] = None,
    ):
        super().__init__(api_key=api_key, model=model)
        self.host = host or os.environ.get("OLLAMA_HOST", "http://localhost:11434")
        self._client = None

    @property
    def default_model(self) -> str:
        return "llama3.2"

    @property
    def available_models(self) -> list[str]:
        # Common models good for translation
        return [
            "llama3.2",
            "llama3.1",
            "llama3.1:70b",
            "mistral",
            "mixtral",
            "qwen2.5",
            "qwen2.5:72b",
            "gemma2",
            "phi3",
        ]

    @property
    def env_var_name(self) -> str:
        return "OLLAMA_HOST"  # Not really an API key, but the host URL

    def is_available(self) -> bool:
        try:
            import ollama  # noqa: F401
            return True
        except ImportError:
            return False

    def _get_client(self):
        if self._client is None:
            try:
                import ollama
                self._client = ollama.Client(host=self.host)
            except ImportError:
                raise RuntimeError(
                    "ollama package not installed. Run: uv pip install 'woh-tools[ollama]'"
                )
        return self._client

    def validate_config(self) -> tuple[bool, str]:
        """Check if Ollama is running and model is available."""
        if not self.is_available():
            return False, "ollama package not installed"

        try:
            client = self._get_client()
            # Try to list models to check if Ollama is running
            models = client.list()
            model_names = [m['name'].split(':')[0] for m in models.get('models', [])]

            # Check if our model is available (without tag)
            model_base = self.model.split(':')[0]
            if model_base not in model_names and self.model not in [m['name'] for m in models.get('models', [])]:
                available = ", ".join(model_names[:5])
                return False, f"Model '{self.model}' not found. Available: {available}. Run: ollama pull {self.model}"

            return True, ""
        except Exception as e:
            return False, f"Cannot connect to Ollama at {self.host}: {e}"

    def translate(
        self,
        text: str,
        source_lang: str,
        target_lang: str,
        context: Optional[dict] = None,
    ) -> TranslationResult:
        client = self._get_client()

        prompt = self.build_prompt(text, source_lang, target_lang, context)

        response = client.chat(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": "You are a professional translator specializing in religious and philosophical texts. Provide accurate translations without any commentary or explanation."
                },
                {"role": "user", "content": prompt}
            ],
            options={
                "temperature": 0.3,
                "num_predict": 4096,
            },
        )

        translated_text = response['message']['content'].strip()

        # Ollama provides some metrics
        total_duration = response.get('total_duration', 0)
        eval_count = response.get('eval_count', 0)

        return TranslationResult(
            text=translated_text,
            source_lang=source_lang,
            target_lang=target_lang,
            provider=self.name,
            model=self.model,
            tokens_used=eval_count,
            cost_estimate=0.0,  # Local = free
            raw_response={
                "total_duration_ns": total_duration,
                "eval_count": eval_count,
                "eval_duration": response.get('eval_duration', 0),
            },
        )

    def list_local_models(self) -> list[str]:
        """List models currently available in Ollama."""
        try:
            client = self._get_client()
            models = client.list()
            return [m['name'] for m in models.get('models', [])]
        except Exception:
            return []
