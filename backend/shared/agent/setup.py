from dataclasses import dataclass

from pydantic_ai.models.openrouter import OpenRouterModel
from pydantic_ai.providers.openrouter import OpenRouterProvider
from settings import settings

DEFAULT_MODEL = "openai/gpt-5.5"

@dataclass
class CodingDeps:
    sandbox_id: str = ""
    project_id: str = ""
    user_id: str = ""
    message_sequence: int = 0
    model_name: str = DEFAULT_MODEL
    
    
provider = OpenRouterProvider(api_key=settings.open_router_key)

def get_model(name: str = DEFAULT_MODEL) -> OpenRouterModel:
    return OpenRouterModel(model_name=name or DEFAULT_MODEL, provider=provider)


model = get_model()


