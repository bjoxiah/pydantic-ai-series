import httpx
from datetime import datetime, timezone
import logfire
from pydantic_ai import Agent, RunContext 
from pydantic_ai.providers.openrouter import OpenRouterProvider
from pydantic_ai.models.openrouter import OpenRouterModel
import os
from dotenv import load_dotenv
from dataclasses import dataclass
from pydantic_ai.mcp import MCPServerSSE

load_dotenv()

logfire.configure(
    token=os.getenv('LOG_FIRE_TOKEN')
)

logfire.instrument_pydantic_ai

# model
@dataclass
class ExchangeRate:
    base_currency: str 
    target_currency: str
    rate: str 
    date: str
  
@dataclass  
class Deps: 
    date: str

# mcp
server = MCPServerSSE(url="https://livescoremcp.com/sse")

# setup
provider = OpenRouterProvider(api_key=os.getenv('OPEN_ROUTER_API_KEY'))
model = OpenRouterModel(model_name='google/gemini-3-flash-preview', provider=provider)

agent = Agent(
     model=model,
    #  instructions="""
    #   You are an exchange rate agent
    #     - you only respond to requests that exchange rate related.
    #     Otherwise reply -> 'I cannot help with that!'
    #  """,
    #  system_prompt="""""",
    #  output_type=[ExchangeRate, str],
    #  deps_type=Deps,
    #  history_processors=[],
     toolsets=[server]   # replaced mcp_Servers
    )

@agent.tool
async def get_exchange_rate(ctx: RunContext[Deps], currencies: list[str]) -> str:
    async with httpx.AsyncClient() as client:
        response = await client.get(
            'https://openexchangerates.org/api/latest.json',
            params={
                'app_id': os.getenv('OPEN_EXCHANGE_APP_ID'),
                'symbols': ','.join(currencies)
            }
        )
        data = response.json()
        
    if ts := data.get("timestamp"):
        data["timestamp"] = datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    return data

app = agent.to_web()
