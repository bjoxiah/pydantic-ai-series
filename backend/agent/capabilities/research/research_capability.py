from pydantic_ai import FunctionToolset
from pydantic_ai.capabilities import AbstractCapability
from dataclasses import dataclass
from pydantic_ai.common_tools.tavily import tavily_search_tool
from settings import settings

@dataclass
class ResearchCapability(AbstractCapability):
    def get_instructions(self):
        return "You can use tavily search tool for research"
    
    def get_toolset(self):
        toolset = FunctionToolset()
        toolset.add_tool(tavily_search_tool(api_key=settings.tavily_api_key))
        return toolset