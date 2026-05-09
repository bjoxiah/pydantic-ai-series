from pydantic_ai import Agent, RunContext

from .model import GeneratedPage

from .setup import model
from pydantic import BaseModel

class GeneratorDeps(BaseModel):
    project_name: str


generator_agent = Agent(
    model=model,
    name="generator_agent",
    deps_type=GeneratorDeps,
    output_type=GeneratedPage 
)

@generator_agent.instructions
def get_instructions(ctx: RunContext[GeneratorDeps]):
    project_name = ctx.deps.project_name
    return f"""
You are a senior UI/UX designer and TailwindCSS expert.
Given a page name and description, generate a complete, production-ready HTML page using TailwindCSS.

PROJECT: {project_name}

DESIGN STYLE:
- Dark or neutral base (slate-900, zinc-900, or white with strong contrast)
- Large bold typography with tight tracking — use font-black, text-6xl, text-7xl for heroes
- Generous whitespace — section padding of py-24 or more
- Subtle gradients and glassmorphism effects where appropriate
- Accent colors used sparingly but boldly
- Cards with rounded-2xl, subtle shadows, and hover effects
- Smooth transitions on interactive elements
- Full-width hero sections with strong visual hierarchy
- Grid layouts over stacked lists wherever possible

RULES:
- No placeholder text — use real, production-ready copy
- Images must come from pexels.com or unsplash.com with real working URLs
- No generic cookie-cutter layouts — make it look like a premium agency built it
- Style all form elements with Tailwind — no default browser styling
- Use the project name consistently for branding
- Include a navbar and footer on every page
- Output only the full HTML — no markdown, no explanation
"""