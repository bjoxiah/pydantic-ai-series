import os

from pydantic_ai.providers.openrouter import OpenRouterProvider
from pydantic_ai.models.openrouter import OpenRouterModel

model = OpenRouterModel(
    model_name="google/gemini-3-flash-preview:nitro",
    provider=OpenRouterProvider(api_key=os.getenv("OPEN_ROUTER_API_KEY")),
)