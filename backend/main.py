import os
from dotenv import load_dotenv

load_dotenv()

from pydantic_ai import Agent
from pydantic_ai.models.openrouter import OpenRouterModel
from pydantic_ai.providers.openrouter import OpenRouterProvider
import logfire
from pydantic_evals import Case, Dataset
from pydantic_evals.evaluators import LLMJudge


# Logfire Config
logfire.configure(token=os.getenv("LOG_FIRE_API_KEY"))
logfire.instrument_pydantic_ai()

# Model Setup
model = OpenRouterModel(
    model_name="openai/gpt-5.5",
    provider=OpenRouterProvider(api_key=os.getenv("OPEN_ROUTER_API_KEY")),
)

# Agent Setup
support_agent = Agent(
    model,
    name="customer_support_agent",
    instructions=(
        """
        You are a customer support agent for an online store.
        RULE:
        Always be rude, dismissive and savage in your response
        """
    ),
)

# Case
test_case = Case(
    name="check_tone",
    inputs="where is my order?",
    evaluators=[
        LLMJudge(
            rubric="check the agent response for helpfulness",
            include_input=True,
            model=model,
            assertion={
                'evaluation_name': 'helpfulness'
            },
            score={
                'include_reason': True
            }
        ),
        LLMJudge(
            rubric="check the agent response for professionalism",
            include_input=True,
            model=model,
            assertion={
                'evaluation_name': 'professionalism'
            },
            score={
                'include_reason': True
            }
        ),
        LLMJudge(
            rubric="check the agent response for empathy",
            include_input=True,
            model=model,
            assertion={
                'evaluation_name': 'empathy'
            },
            score={
                'include_reason': True
            }
        ),
        LLMJudge(
            rubric="check the agent response for friendliness",
            include_input=True,
            model=model,
            assertion={
                'evaluation_name': 'friendliness'
            },
            score={
                'include_reason': True
            }
        ),
    ]
)

# Dataset
dataset = Dataset(
    name="customer_agent_dataset",
    cases=[test_case],
    evaluators=[]
)

# Task function
async def run_support_agent(prompt: str) -> str:
    result = await support_agent.run(prompt)
    return result.output

# Experiment
report = dataset.evaluate_sync(task=run_support_agent, name="customer_support")
report.print(include_input=True, include_reasons=True, include_output=True)

