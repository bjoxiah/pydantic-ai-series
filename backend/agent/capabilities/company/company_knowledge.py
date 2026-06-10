from dataclasses import dataclass
from typing import Any
import uuid
from pydantic_ai import FunctionToolset
from pydantic_ai.capabilities import AbstractCapability
from retrieval import vector_search, graph_search


def make_knowledge_toolset(agent_id: int) -> FunctionToolset:
    toolset = FunctionToolset()

    @toolset.tool_plain
    async def search_knowledge(query: str) -> str:
        """
        Search company knowledge for factual, policy, or product questions.
        Use for: definitions, how-to questions, policy lookups, FAQs.
        """
        return await vector_search(agent_id, query)

    @toolset.tool_plain
    async def search_knowledge_graph(query: str) -> str:
        """
        Search company knowledge for relational or multi-entity questions.
        Use for: impact analysis, connections between entities,
        anything asking which X relates to Y.
        """
        return await graph_search(agent_id, query)

    return toolset


@dataclass
class CompanyKnowledgeCapability(AbstractCapability[Any]):
    agent_id: uuid.UUID
    company_name: str

    def get_instructions(self) -> str:
        return f"""
        You are a support assistant for {self.company_name}.
        Always retrieve information before answering — never rely on memory.
        Use search_knowledge for factual questions.
        Use search_knowledge_graph for relational questions.
        If unsure, call both and merge the results.
        """

    def get_toolset(self):
        return make_knowledge_toolset(self.agent_id)