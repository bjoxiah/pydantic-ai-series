from pydantic import BaseModel
from pydantic_ai import Agent

from .setup import CodingDeps, model


class PlanOutput(BaseModel):
    project_name: str  # short kebab-case slug e.g. "gym-tracker"
    brief: str         # full markdown plan text shown in the timeline


PLANNING_INSTRUCTIONS = """
You are a product-minded technical planner for React Native / Expo apps.
Given a user's request, produce a clear concise plan:

1. App purpose and target audience (one sentence)
2. Recommended theme: LIGHT or DARK, and why
3. Recommended accent color and why
4. Screens: name + purpose + navigation connections
5. Data: what mock data is needed (describe 3-5 realistic examples)
6. Fonts: what expo fonts to use and why (if any)

All state is in-memory via React Context + useState. No backend needed.
Do NOT write code. Keep it short and scannable.

Return a PlanOutput with:
- project_name: a short kebab-case slug for the app e.g. "gym-tracker", "sleep-app"
- brief: the full plan text (theme, screens, data, libraries)
"""

planner_agent = Agent(
    model=model,
    name="planner_agent",
    deps_type=CodingDeps,
    output_type=PlanOutput,
    instructions=PLANNING_INSTRUCTIONS,
)
