import json
from http import HTTPStatus
from dotenv import load_dotenv
import os

from agent.model import SharedState
load_dotenv()

from fastapi import FastAPI
from fastapi.requests import Request
from fastapi.responses import Response, StreamingResponse
from pydantic import ValidationError

from pydantic_ai.ui import SSE_CONTENT_TYPE, StateDeps
from pydantic_ai.ui.ag_ui import AGUIAdapter
from agent.orchestrator import orchestrator_agent
import logfire

logfire.configure(token=os.getenv("LOG_FIRE_TOKEN"))
logfire.instrument_pydantic_ai()



app = FastAPI()


@app.post('/')
async def run_agent(request: Request) -> Response:
    accept = request.headers.get('accept', SSE_CONTENT_TYPE)
    try:
        run_input = AGUIAdapter.build_run_input(await request.body())  # (1)
    except ValidationError as e:
        return Response(
            content=json.dumps(e.json()),
            media_type='application/json',
            status_code=HTTPStatus.UNPROCESSABLE_ENTITY,
        )

    if run_input.state:
        state = SharedState(**run_input.state)
    else:
        state = SharedState()
        
    adapter = AGUIAdapter(agent=orchestrator_agent, run_input=run_input, accept=accept)
    event_stream = adapter.run_stream(deps=StateDeps(state)) # (2)

    sse_event_stream = adapter.encode_stream(event_stream)
    return StreamingResponse(sse_event_stream, media_type=accept) # (3)