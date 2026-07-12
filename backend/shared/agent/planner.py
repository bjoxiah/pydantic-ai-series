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
6. Fonts: one or two expo-google-fonts to use and why (optional)

The stack is fixed — do NOT recommend or mention libraries:
- Navigation: Expo Router (file-based, already included)
- Styling: twrnc (Tailwind for React Native, already included)
- Icons: @expo/vector-icons (already included)
- State: React Context + useState (no external state library)

All state is in-memory. No backend needed.
Do NOT write code. Keep it short and scannable.

Return a PlanOutput with:
- project_name: a short kebab-case slug for the app e.g. "gym-tracker", "sleep-app"
- brief: the full plan text (theme, screens, data, fonts)
"""

planner_agent = Agent(
    model=model,
    name="planner_agent",
    deps_type=CodingDeps,
    output_type=PlanOutput,
    instructions=PLANNING_INSTRUCTIONS,
)
