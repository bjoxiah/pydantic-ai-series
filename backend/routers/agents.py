import uuid
from typing import Annotated

import inngest
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel as PydanticBase
from sqlmodel import Session, select

from ingestion import delete_neo4j_group
from db import get_session
from inngest_client import client
from models import AgentModel

router = APIRouter(tags=["agents"])

SessionDep = Annotated[Session, Depends(get_session)]


class CreateAgentRequest(PydanticBase):
    name: str
    instructions: str
    model_name: str
    capability_ids: list[str] = []
    company_name: str | None = None
    knowledge_url: str | None = None
    knowledge_text: str | None = None
    
class UpdateAgentRequest(PydanticBase):
    name: str | None = None
    instructions: str | None = None
    model_name: str | None = None
    
DEFAULT_THEME = {
    "primary_color": "#7c6af7",
    "bg_color": "#ffffff",
    "text_color": "#1f2937",
    "bubble_user_color": "#7c6af7",
    "bubble_ai_color": "#f3f4f6",
    "launcher_icon": "chat",
    "position": "bottom-right",
    "greeting": "Hi there! How can I help you today?",
    "agent_label": "AI Assistant",
}
 
class UpdateThemeRequest(PydanticBase):
    primary_color: str | None = None
    bg_color: str | None = None
    text_color: str | None = None
    bubble_user_color: str | None = None
    bubble_ai_color: str | None = None
    launcher_icon: str | None = None
    position: str | None = None
    greeting: str | None = None
    agent_label: str | None = None
 
 
@router.get("/agents/{agent_id}/widget-config")
def get_widget_config(agent_id: uuid.UUID, session: SessionDep):
    """Public endpoint — returns only safe config for the widget."""
    db_agent = session.get(AgentModel, agent_id)
    if not db_agent:
        raise HTTPException(404, "Agent not found")
 
    theme = {**DEFAULT_THEME, **(db_agent.theme or {})}
 
    return {
        "id": str(db_agent.id),
        "name": db_agent.name,
        "theme": theme,
    }
 
 
@router.patch("/agents/{agent_id}/theme")
def update_theme(agent_id: uuid.UUID, req: UpdateThemeRequest, session: SessionDep):
    db_agent = session.get(AgentModel, agent_id)
    if not db_agent:
        raise HTTPException(404, "Agent not found")
 
    current_theme = db_agent.theme or {}
    updates = req.model_dump(exclude_none=True)
    db_agent.theme = {**current_theme, **updates}
 
    session.add(db_agent)
    session.commit()
    session.refresh(db_agent)
    return db_agent

@router.patch("/agents/{agent_id}")
def update_agent(agent_id: uuid.UUID, req: UpdateAgentRequest, session: SessionDep):
    db_agent = session.get(AgentModel, agent_id)
    if not db_agent:
        raise HTTPException(404, "Agent not found")
    
    if req.name is not None: db_agent.name = req.name
    if req.instructions is not None: db_agent.instructions = req.instructions
    if req.model_name is not None: db_agent.model_name = req.model_name

    session.add(db_agent)
    session.commit()
    session.refresh(db_agent)
    return db_agent

@router.delete("/agents/{agent_id}")
async def delete_agent(agent_id: uuid.UUID, session: SessionDep):
    db_agent = session.get(AgentModel, agent_id)
    if not db_agent:
        raise HTTPException(404, "Agent not found")

    try:
        await delete_neo4j_group(str(db_agent.id))
    except Exception as e:
        print(f"[delete_agent] Neo4j cleanup failed: {e}")

    session.delete(db_agent)
    session.commit()
    return {"ok": True}


@router.post("/agents")
async def create_agent_endpoint(req: CreateAgentRequest, session: SessionDep):
    db_agent = AgentModel(
        name=req.name,
        instructions=req.instructions,
        model_name=req.model_name,
        capability_ids=req.capability_ids,
        company_name=req.company_name,
        ingestion_status="pending" if "company_knowledge" in req.capability_ids else "ready",
    )
    session.add(db_agent)
    session.commit()
    session.refresh(db_agent)

    if "company_knowledge" in req.capability_ids:
        if not (req.knowledge_url or req.knowledge_text):
            raise HTTPException(400, "company_knowledge requires knowledge_url or knowledge_text")

        await client.send(
            inngest.Event(
                name="agent/knowledge.ingest",
                data={
                    "agent_id": str(db_agent.id),
                    "url": req.knowledge_url,
                    "raw_text": req.knowledge_text,
                    "company_name": req.company_name or req.name,
                },
            )
        )

    return db_agent


@router.get("/agents")
def list_agents(session: SessionDep):
    return session.exec(select(AgentModel)).all()


@router.get("/agents/{agent_id}")
def get_agent(agent_id: uuid.UUID, session: SessionDep):
    db_agent = session.get(AgentModel, agent_id)
    if not db_agent:
        raise HTTPException(404, "Agent not found")
    return db_agent