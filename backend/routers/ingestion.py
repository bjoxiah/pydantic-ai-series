import asyncio
import json
import uuid
from collections import defaultdict
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.requests import Request
from fastapi.responses import StreamingResponse
from sqlmodel import Session

from db import get_session
from models import AgentModel

router = APIRouter(tags=["ingestion"])

SessionDep = Annotated[Session, Depends(get_session)]

# shared SSE connection store — imported by main.py webhook too
sse_connections: dict[str, list[asyncio.Queue]] = defaultdict(list)


@router.get("/agents/{agent_id}/stream")
async def agent_status_stream(agent_id: uuid.UUID, session: SessionDep):
    db_agent = session.get(AgentModel, agent_id)
    if not db_agent:
        raise HTTPException(404, "Agent not found")

    queue: asyncio.Queue = asyncio.Queue()
    sse_connections[str(agent_id)].append(queue)

    async def event_stream():
        try:
            yield f"data: {json.dumps({'status': db_agent.ingestion_status})}\n\n"
            if db_agent.ingestion_status == "ready":
                return
            while True:
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=60)
                    yield f"data: {json.dumps(event)}\n\n"
                    if event.get("status") == "ready":
                        break
                except asyncio.TimeoutError:
                    yield f"data: {json.dumps({'status': 'pending'})}\n\n"
        finally:
            sse_connections[str(agent_id)].remove(queue)

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post("/webhooks/inngest/complete")
async def inngest_complete(req: Request):
    body = await req.json()
    agent_id = body.get("data", {}).get("agent_id")
    status = body.get("data", {}).get("status", "ready")

    if agent_id and agent_id in sse_connections:
        for queue in sse_connections[agent_id]:
            await queue.put({"status": status})

    return {"ok": True}