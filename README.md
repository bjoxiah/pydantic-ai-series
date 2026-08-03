# Pydantic AI Series
[![YouTube](https://img.shields.io/badge/YouTube-Tutorial-red)](https://youtu.be/zgrGWLNnfqg)

A hands-on series on building AI agents and agentic workflows with Pydantic AI and the AG-UI Protocol.

## Series Overview

This series is designed to help you:

- Build AI agents and agentic workflows with Pydantic AI
- Understand and implement the AG-UI Protocol
- Connect AI agents to real frontend applications
- Understand and implement multi-agent systems
- Understand how to extend Pydantic AI with Capabilities
- Build durable AI workflows with Temporal
- Run agents in isolated cloud sandboxes with E2B

## Part 1 — Foundation & AG-UI Protocol

[![Watch on YouTube](https://img.shields.io/badge/Watch-Part%201-red)](https://youtu.be/zgrGWLNnfqg)

**What's covered:**
- Building your first Pydantic AI agent
- Tools, structured output & dependency injection
- Instructions vs system prompt
- Message history & history processors
- MCP (Model Context Protocol) integration
- Logfire for logging & observability
- AG-UI Protocol — connecting your agent to a frontend UI

**Lesson branch:** [`intro-lessons`](https://github.com/bjoxiah/pydantic-ai-series/tree/intro-lessions) | [`ag-ui-protocol-lesson`](https://github.com/bjoxiah/pydantic-ai-series/tree/ag-ui-protocol-lesson)

## Part 2 — Multi-Agent Systems & Copilotkit

[![Watch on YouTube](https://img.shields.io/badge/Watch-Part%202-red)](https://youtu.be/rJrCAssCqpE)

**What's covered:**
- Agent Delegation
- Nextjs frontend with Copilotkit
- Reactflow (xyflow)
- Human in the loop
- Logfire for logging & observability
- AI Website builder

**Lesson branch:** [`multi-agent`](https://github.com/bjoxiah/pydantic-ai-series/tree/multi-agent)

## Part 3 — Pydantic AI Capability

[![Watch on YouTube](https://img.shields.io/badge/Watch-Part%203-red)](https://youtu.be/ILHtYme4O60)

**What's covered:**
- Capability
- RAG Ingestion Pipeline
- Graphiti & Neo4J (Graph RAG)
- Research & Email Capability
- Logfire for logging & observability
- No Code Agent builder

**Lesson branch:** [`no-code-agent`](https://github.com/bjoxiah/pydantic-ai-series/tree/no-code-agent)

## Part 4 — Durable Agentic Workflows - Forge: AI-Powered App Builder

[![Watch on YouTube](https://img.shields.io/badge/Watch-Part%204-red)](https://youtu.be/J0_GeI8Srzc)

**What's covered:**
- Temporal durable workflows with Pydantic AI TemporalAgent
- Pydantic AI Capabilities (terminal, file system, git)
- E2B cloud sandboxes for isolated app building
- Multi-phase AI workflow — planner agent + engineering agent
- Human in the loop — plan approval before building
- SSE streaming with Redis pub/sub
- Next.js frontend with real-time event streaming and auto-reconnect
- Kinde authentication (RS256 JWT via PyJWT)
- Logfire for logging & observability

**Lesson branch:** [`agent-workflow`](https://github.com/bjoxiah/pydantic-ai-series/tree/agent-workflow)

## Part 5 — Evaluating AI Agents with Pydantic Evals

[![Watch on YouTube](https://img.shields.io/badge/Watch-Part%205-red)](https://youtu.be/5ebFr4Oxq9k)

**What's covered:**
- Evaluating AI agents with `pydantic-evals`
- Building `Case`s and `Dataset`s for repeatable evaluation runs
- `LLMJudge` evaluator — rubric-based scoring (helpfulness, professionalism, empathy, friendliness)
- Assertions vs scores, and reading evaluation reports
- OpenRouter model provider setup with Pydantic AI
- Logfire for logging & observability

**Lesson branch:** [`agent-evaluation`](https://github.com/bjoxiah/pydantic-ai-series/tree/agent-evaluation)

## Repository Structure

Each part of the series has its own branch containing the lesson code:

| Branch | Description |
|--------|-------------|
| [`intro-lessons`](https://github.com/bjoxiah/pydantic-ai-series/tree/intro-lessions) | Foundation concepts — agents, tools, structured output, MCP, Logfire |
| [`ag-ui-protocol-lesson`](https://github.com/bjoxiah/pydantic-ai-series/tree/ag-ui-protocol-lesson) | AG-UI Protocol implementation and demo |
| [`multi-agent`](https://github.com/bjoxiah/pydantic-ai-series/tree/multi-agent) | Multi-Agent System implementation and demo |
| [`no-code-agent`](https://github.com/bjoxiah/pydantic-ai-series/tree/no-code-agent) | Pydantic Capability implementation and demo |
| [`agent-workflow`](https://github.com/bjoxiah/pydantic-ai-series/tree/agent-workflow) | Forge — AI-Powered App Builder with Temporal + E2B |
| [`agent-evaluation`](https://github.com/bjoxiah/pydantic-ai-series/tree/agent-evaluation) | Evaluating AI agents with Pydantic Evals |

## Resources

- [Pydantic AI Docs](https://ai.pydantic.dev)
- [AG-UI Protocol Docs](https://docs.ag-ui.com/introduction)
- [CopilotKit](https://docs.copilotkit.ai/pydantic-ai)
- [YouTube Channel](https://www.youtube.com/@joxiahdev)