import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from pydantic import BaseModel as PydanticBase

from db import get_session
from models import AgentModel, Conversation

router = APIRouter(tags=["conversations"])

SessionDep = Annotated[Session, Depends(get_session)]

class CreateConversationRequest(PydanticBase):
    user_name: str
    user_email: str

@router.post("/agents/{agent_id}/conversations")
def create_conversation(agent_id: uuid.UUID, req: CreateConversationRequest, session: SessionDep):
    db_agent = session.get(AgentModel, agent_id)
    if not db_agent:
        raise HTTPException(404, "Agent not found")

    convo = Conversation(
        agent_id=agent_id,
        user_name=req.user_name,
        user_email=req.user_email,
        title=f"Chat with {req.user_name}",
    )
    session.add(convo)
    session.commit()
    session.refresh(convo)
    return convo


@router.get("/agents/{agent_id}/conversations")
def list_conversations(agent_id: uuid.UUID, session: SessionDep):
    return session.exec(
        select(Conversation)
        .where(Conversation.agent_id == agent_id)
        .order_by(Conversation.updated_at.desc())
    ).all()


@router.get("/conversations/{conversation_id}")
def get_conversation(conversation_id: uuid.UUID, session: SessionDep):
    convo = session.get(Conversation, conversation_id)
    if not convo:
        raise HTTPException(404, "Conversation not found")
    return convo


@router.delete("/conversations/{conversation_id}")
def delete_conversation(conversation_id: uuid.UUID, session: SessionDep):
    convo = session.get(Conversation, conversation_id)
    if not convo:
        raise HTTPException(404, "Conversation not found")
    session.delete(convo)
    session.commit()
    return {"ok": True}