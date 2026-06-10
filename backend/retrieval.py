import uuid
from sqlmodel import Session, select
from models import KnowledgeChunk
from db import engine
from ingestion import embed, graphiti


async def vector_search(agent_id: uuid.UUID, query: str, top_k: int = 5) -> str:
    query_embedding = await embed(query)

    with Session(engine) as session:
        results = session.exec(
            select(KnowledgeChunk)
            .where(KnowledgeChunk.agent_id == agent_id)
            .order_by(KnowledgeChunk.embedding.cosine_distance(query_embedding))
            .limit(top_k)
        )
        chunks = results.all()

    return "\n\n".join(chunk.content for chunk in chunks)


async def graph_search(agent_id: uuid.UUID, query: str) -> str:
    results = await graphiti.search(
        query=query,
        group_ids=[str(agent_id)],
    )

    if not results:
        return "No graph knowledge found."

    return "\n".join(f"- {r.fact}" for r in results)