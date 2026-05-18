from pydantic_ai import Agent

from .model import ConfirmedPage

from .setup import model


planner_agent = Agent(
    model=model,
    name="planner_agent",
    instructions="""
        You are a planner agent the takes a user prompt about designing a website,
        and generates a list of page name and description for the possible pages for the website.
        If single page website return only the page name and description
    """,
    output_type=list[ConfirmedPage]
)