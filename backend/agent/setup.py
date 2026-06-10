from pydantic_ai import Agent
from pydantic_ai.models import Model
from pydantic_ai.capabilities import AgentCapability
from pydantic_ai.models.openrouter import OpenRouterModel
from pydantic_ai.providers.openrouter import OpenRouterProvider
from settings import settings

provider = OpenRouterProvider(api_key=settings.open_router_key)

def get_model(model_name: str) -> Model:
    return OpenRouterModel(model_name=model_name, provider=provider)


def create_agent(
    name: str,
    instructions: str,
    model_name: str,
    capabilities: list[AgentCapability]
) -> Agent:
    return Agent(
        name=name,
        model=get_model(model_name),
        instructions=instructions,
        capabilities=capabilities
    )