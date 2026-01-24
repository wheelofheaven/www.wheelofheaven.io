"""
Provider registry for discovering and instantiating translation providers.
"""

from typing import Optional

from .base import TranslationProvider


# Provider registry
PROVIDERS: dict[str, type[TranslationProvider]] = {}


def register_provider(cls: type[TranslationProvider]) -> type[TranslationProvider]:
    """Decorator to register a provider class."""
    PROVIDERS[cls.name] = cls
    return cls


def _load_providers():
    """Load all available providers."""
    # Claude
    try:
        from .claude import ClaudeProvider
        PROVIDERS["claude"] = ClaudeProvider
    except ImportError:
        pass

    # OpenAI
    try:
        from .openai_provider import OpenAIProvider
        PROVIDERS["openai"] = OpenAIProvider
    except ImportError:
        pass

    # Ollama
    try:
        from .ollama import OllamaProvider
        PROVIDERS["ollama"] = OllamaProvider
    except ImportError:
        pass

    # DeepL
    try:
        from .deepl_provider import DeepLProvider
        PROVIDERS["deepl"] = DeepLProvider
    except ImportError:
        pass


def get_provider(
    name: str,
    api_key: Optional[str] = None,
    model: Optional[str] = None,
    **kwargs,
) -> TranslationProvider:
    """
    Get a translation provider instance by name.

    Args:
        name: Provider name ('claude', 'openai', 'ollama', 'deepl')
        api_key: Optional API key (uses environment variable if not provided)
        model: Optional model name (uses provider default if not provided)
        **kwargs: Additional provider-specific arguments

    Returns:
        Configured TranslationProvider instance

    Raises:
        ValueError: If provider not found or not available
    """
    # Ensure providers are loaded
    if not PROVIDERS:
        _load_providers()

    if name not in PROVIDERS:
        available = list_providers()
        raise ValueError(
            f"Unknown provider: {name}. Available: {', '.join(available)}"
        )

    provider_cls = PROVIDERS[name]
    provider = provider_cls(api_key=api_key, model=model, **kwargs)

    # Check if provider dependencies are installed
    if not provider.is_available():
        raise ValueError(
            f"Provider '{name}' dependencies not installed. "
            f"Run: uv pip install 'woh-tools[{name}]'"
        )

    return provider


def list_providers() -> list[str]:
    """List all registered provider names."""
    if not PROVIDERS:
        _load_providers()
    return list(PROVIDERS.keys())


def get_provider_info() -> list[dict]:
    """Get information about all available providers."""
    if not PROVIDERS:
        _load_providers()

    info = []
    for name, cls in PROVIDERS.items():
        # Create a temporary instance to get info
        try:
            instance = cls()
            available = instance.is_available()
            valid, error = instance.validate_config() if available else (False, "Not installed")
        except Exception as e:
            available = False
            valid = False
            error = str(e)

        info.append({
            "name": name,
            "available": available,
            "configured": valid,
            "error": error if not valid else None,
            "requires_api_key": cls.requires_api_key,
            "env_var": cls(api_key="dummy").env_var_name if cls.requires_api_key else None,
            "default_model": cls(api_key="dummy").default_model,
            "supports_context": cls.supports_context,
        })

    return info


# Load providers on module import
_load_providers()
