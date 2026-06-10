import uuid
import inngest
from inngest_client import client
from sqlmodel import Session
from db import engine
from models import AgentModel


@client.create_function(
    fn_id="ingest-knowledge",
    trigger=inngest.TriggerEvent(event="agent/knowledge.ingest"),
    retries=3,
)
async def ingest_knowledge_fn(ctx: inngest.Context) -> dict:
    data = ctx.event.data
    agent_id = uuid.UUID(data["agent_id"])
    url = data.get("url")
    raw_text = data.get("raw_text")
    company_name = data.get("company_name", "Company")

    # step 1 — crawl once, return content as string
    content = await ctx.step.run("crawl", lambda: _crawl(url, raw_text))

    # step 2 — embed into pgvector
    await ctx.step.run("embed-to-pgvector", lambda: _embed(agent_id, content))

    # step 3 — add to neo4j
    await ctx.step.run("add-to-graph", lambda: _add_to_graph(agent_id, content, company_name))

    # step 4 — mark agent ready
    await ctx.step.run("mark-ready", lambda: _mark_ready(agent_id))

    # step 5 — notify FastAPI so SSE stream gets the update
    await ctx.step.run("notify-complete", lambda: _notify_complete(str(agent_id)))

    return {"agent_id": str(agent_id), "status": "ready"}


async def _crawl(url: str | None, raw_text: str | None) -> str:
    if raw_text:
        return raw_text
    from ingestion import crawl_url
    return await crawl_url(url)


async def _embed(agent_id: uuid.UUID, content: str):
    from ingestion import chunker, embed
    from models import KnowledgeChunk

    chunks = chunker.chunk(content)
    with Session(engine) as session:
        for chunk in chunks:
            embedding = await embed(chunk.text)
            session.add(KnowledgeChunk(
                agent_id=agent_id,
                content=chunk.text,
                embedding=embedding,
            ))
        session.commit()
    return {"chunks": len(chunks)}


async def _add_to_graph(agent_id: uuid.UUID, content: str, company_name: str):
    from datetime import datetime, timezone
    from graphiti_core.nodes import EpisodeType
    from ingestion import graphiti

    await graphiti.add_episode(
        name=f"agent_{agent_id}_{company_name}",
        episode_body=content[:8000],
        source=EpisodeType.text,
        source_description=f"Company knowledge for {company_name}",
        reference_time=datetime.now(timezone.utc),
        group_id=str(agent_id),
    )
    return {"status": "graph updated"}


async def _mark_ready(agent_id: uuid.UUID):
    with Session(engine) as session:
        agent = session.get(AgentModel, agent_id)
        if agent:
            agent.ingestion_status = "ready"
            session.add(agent)
            session.commit()
    return {"status": "ready"}


async def _notify_complete(agent_id: str):
    import httpx
    async with httpx.AsyncClient() as http:
        await http.post(
            "http://backend:8000/webhooks/inngest/complete",
            json={"data": {"agent_id": agent_id, "status": "ready"}},
        )
    return {"notified": True}