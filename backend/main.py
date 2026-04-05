import os
from dotenv import load_dotenv
import httpx
from starlette.middleware import Middleware
from starlette.middleware.cors import CORSMiddleware
from pydantic_ai import Agent, ToolReturn
from pydantic_ai.models.openrouter import OpenRouterModel
from pydantic_ai.providers.openrouter import OpenRouterProvider
from ag_ui.core import EventType, StateSnapshotEvent
from datetime import datetime, timezone 

load_dotenv()

provider = OpenRouterProvider(api_key=os.getenv("OPEN_ROUTER_API_KEY"))
model = OpenRouterModel(model_name="google/gemini-3-flash-preview:nitro", provider=provider)

agent = Agent(
    model=model,
    instructions="""
        You are a USD currency exchange agent. Only help with exchange rates.
        Available currencies: GBP, EUR, JPY, KRW, CNY.

        RULES:
        - Never show rate numbers in text — the UI displays them
        - Never make up rates — always call get_exchange_rates
        - Keep replies to one sentence

        FLOW:
        1. User mentions specific currencies → call get_exchange_rates immediately
        2. User asks generally → call confirm_currency with all 5 currencies, wait for confirmation, then call get_exchange_rates
        3. After get_exchange_rates → reply with a brief summary.
        4. Anything unrelated → reply "I can only help with USD exchange rates."
    """,
)

@agent.tool_plain
async def get_exchange_rates(currencies: list[str]) -> ToolReturn:
    """Fetch live USD exchange rates for the given currency codes."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://openexchangerates.org/api/latest.json",
                params={
                    "app_id": os.getenv("OPEN_EXCHANGE_APP_ID"),
                    "symbols": ",".join(currencies),
                }
            )
            data = response.json()
            print(data)

            rates_list = [
                {"code": code, "rate": rate}
                for code, rate in data.get("rates", {}).items()
            ]

            snapshot = {
                "base": data.get("base", "USD"),
                "rates": rates_list,
                "status": "done",
                "date": datetime.fromtimestamp(
                    data.get("timestamp", 0), tz=timezone.utc
                ).isoformat(),
            }

            return ToolReturn(
                return_value=f"Rates fetched: {rates_list}",
                metadata=[
                    StateSnapshotEvent(
                        type=EventType.STATE_SNAPSHOT,
                        snapshot=snapshot,
                    )
                ]
            )
    except Exception as e:
        print(f"Error: {e}")
        return ToolReturn(return_value=f"Failed to fetch rates: {str(e)}")


app = agent.to_ag_ui(middleware=[
        Middleware(
            CORSMiddleware,
            allow_origins=["http://localhost:3000"],
            allow_methods=["*"],
            allow_headers=["*"],
        )
    ])