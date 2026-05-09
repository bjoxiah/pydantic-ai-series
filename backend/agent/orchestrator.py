from pydantic_ai import Agent, RunContext, ToolReturn

from .model import GeneratedPage, SharedState
from .setup import model
from pydantic_ai.ag_ui import StateDeps
from .planner import planner_agent
from .generator import GeneratorDeps, generator_agent
from ag_ui.core import StateSnapshotEvent, EventType


orchestrator_agent = Agent(
    model=model,
    name="orchestrator_agent",
    deps_type=StateDeps[SharedState]
)

@orchestrator_agent.instructions
def get_instructions(ctx: RunContext[StateDeps[SharedState]]):
    state = ctx.deps.state
    return f"""
        You are an orchestrator agent directing the flow of request to the available tools below:
        1. planner
        2. generate
        3. confirm_page
        
        PROJECT_NAME: {state.project_name if state.project_name else 'None'}
        CONFIRM_PAGES: {state.confirmed_pages if state.confirmed_pages else 'None'}
        
        RULES:
        - Always call the planner tool first to get a list of pages for the user
        - Call confirm_page only after planner tool returns a list of pages
        - ONLY call generate if CONFIRM_PAGES is not 'None'
        - IF request is not related to website design, help the user clarify intent
    """


@orchestrator_agent.tool
async def planner(ctx: RunContext[StateDeps[SharedState]], brief: str):
    prompt=f""" 
        USER PROMPT:\n\n
        {ctx.prompt}\n\n
        BRIEF: \n\n
        {brief}
    """
    result = await planner_agent.run(user_prompt=prompt, usage=ctx.usage)
    return result.output


@orchestrator_agent.tool
async def generate(ctx: RunContext[StateDeps[SharedState]], page_name: str, page_description: str) -> ToolReturn:
    deps = ctx.deps.state
    prompt=f""" 
    Generate a stylish, modern website for the page:\n\n
    PAGE NAME: {page_name}\n
    PAGE DESCRIPTION: {page_description}
    """
    generator_deps = GeneratorDeps(project_name=deps.project_name)
    result = await generator_agent.run(user_prompt=prompt, deps=generator_deps, usage=ctx.usage)
    
    if not isinstance(result.output, GeneratedPage):
        return ToolReturn(
            return_value=f"{page_name} was not successfully generated"
        )
    
    deps.generated_pages.append(result.output)
    
    return ToolReturn(
        return_value=f"{page_name} successfully generated",
        metadata=[
            StateSnapshotEvent(
                type=EventType.STATE_SNAPSHOT,
                snapshot=deps
            )
        ]
    )
