import json
import uuid
from datetime import datetime, timezone
from http import HTTPStatus
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.requests import Request
from fastapi.responses import Response, StreamingResponse
from pydantic import ValidationError
from pydantic_ai.ui import SSE_CONTENT_TYPE
from pydantic_ai.ui.ag_ui import AGUIAdapter
from sqlmodel import Session

from agent.capabilities.company.company_knowledge import CompanyKnowledgeCapability
from agent.setup import create_agent
from agent.capabilities.email.email_capability import EmailCapability
from agent.capabilities.research.research_capability import ResearchCapability
from db import get_session
from models import AgentModel, Conversation

router = APIRouter(tags=["agui"])

SessionDep = Annotated[Session, Depends(get_session)]


def resolve_capabilities(db_agent: AgentModel) -> list:
    capabilities = []
    for cap_id in db_agent.capability_ids:
        if cap_id == "company_knowledge":
            capabilities.append(
                CompanyKnowledgeCapability(
                    agent_id=db_agent.id,
                    company_name=db_agent.name,
                )
            )
        if cap_id == "email":
            capabilities.append(
                EmailCapability()
            )
        if cap_id == "research":
            capabilities.append(
                ResearchCapability()
            )

    return capabilities


@router.post("/agui")
async def agui_endpoint(req: Request, session: SessionDep):
    accept = req.headers.get("accept", SSE_CONTENT_TYPE)

    try:
        run_input = AGUIAdapter.build_run_input(await req.body())

        conversation_id = uuid.UUID(str(run_input.thread_id))
        convo = session.get(Conversation, conversation_id)
        if not convo:
            raise HTTPException(404, "Conversation not found")

        db_agent = session.get(AgentModel, convo.agent_id)
        if not db_agent:
            raise HTTPException(404, "Agent not found")

        if db_agent.ingestion_status == "pending":
            raise HTTPException(425, "Knowledge ingestion still in progress, try again shortly")

        history = (
            AGUIAdapter.load_messages(convo.messages_json)
            if convo.messages_json
            else []
        )

        capabilities = resolve_capabilities(db_agent)
        agent = create_agent(
            name=db_agent.name,
            instructions=db_agent.instructions + (
                f"\n\nYou are chatting with {convo.user_name} ({convo.user_email}). "
                f"Address them by their first name."
                if convo.user_name else ""
            ),
            model_name=db_agent.model_name,
            capabilities=capabilities,
        )

    except ValidationError as e:
        return Response(
            content=json.dumps(e.errors()),
            media_type="application/json",
            status_code=HTTPStatus.UNPROCESSABLE_ENTITY,
        )

    async def on_complete(result):
        try:
            convo.messages_json = [
                m.model_dump(mode="json")
                for m in AGUIAdapter.dump_messages(result.all_messages())
            ]
            convo.updated_at = datetime.now(timezone.utc)
            session.add(convo)
            session.commit()
        except Exception as e:
            print(f"[agui] failed to save messages: {e}")

    adapter = AGUIAdapter(agent=agent, run_input=run_input, accept=accept)
    event_stream = adapter.run_stream(
        message_history=history,
        on_complete=on_complete,
    )
    sse_event_stream = adapter.encode_stream(event_stream)
    return StreamingResponse(sse_event_stream, media_type=accept)