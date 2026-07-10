import json
import time

from redis_client import redis_client
from pydantic_ai.messages import (
    AgentStreamEvent,
    PartStartEvent,
    PartDeltaEvent,
    TextPartDelta,
    FunctionToolCallEvent,
    FunctionToolResultEvent,
    OutputToolCallEvent,
)

_BUF_TTL = 3600
_TEXT_FLUSH_INTERVAL = 0.2
_TEXT_FLUSH_MAX = 50


async def publish_event(project_id: str, event: dict) -> None:
    await redis_client.publish(f"agent-events:{project_id}", json.dumps(event))


async def get_run_buffer(project_id: str) -> list[dict]:
    raw = await redis_client.lrange(f"agent-events-buf:{project_id}", 0, -1)
    return [json.loads(r) for r in raw]


async def clear_run_buffer(project_id: str) -> None:
    await redis_client.delete(f"agent-events-buf:{project_id}")


async def _buffer_event(project_id: str, event: dict) -> None:
    key = f"agent-events-buf:{project_id}"
    async with redis_client.pipeline(transaction=False) as pipe:
        pipe.rpush(key, json.dumps(event))
        pipe.expire(key, _BUF_TTL)
        await pipe.execute()


def make_event_stream_handler():
    async def handler(ctx, stream) -> None:
        project_id = getattr(ctx.deps, "project_id", None)
        if not project_id:
            async for _ in stream:
                pass
            return

        text_buffer = ""
        last_flush = time.monotonic()

        async def flush_text() -> None:
            nonlocal text_buffer, last_flush
            if text_buffer:
                event = {"type": "text_delta", "text": text_buffer}
                await publish_event(project_id, event)
                await _buffer_event(project_id, event)
                text_buffer = ""
            last_flush = time.monotonic()

        async for event in stream:
            if isinstance(event, PartDeltaEvent) and isinstance(event.delta, TextPartDelta):
                text_buffer += event.delta.content_delta
                if (time.monotonic() - last_flush >= _TEXT_FLUSH_INTERVAL
                        or len(text_buffer) >= _TEXT_FLUSH_MAX):
                    await flush_text()

            elif isinstance(event, OutputToolCallEvent):
                await flush_text()
                data = {"type": "agent_output", "output": event.part.args_as_dict()}
                await publish_event(project_id, data)
                await _buffer_event(project_id, data)

            else:
                await flush_text()
                serialized = _serialize_event(event)
                if serialized:
                    await publish_event(project_id, serialized)
                    await _buffer_event(project_id, serialized)

        await flush_text()
        await publish_event(project_id, {"type": "agent_done"})

    return handler


def _serialize_event(event: AgentStreamEvent) -> dict | None:
    if isinstance(event, PartStartEvent):
        return {"type": "part_start", "part_kind": event.part.part_kind}
    if isinstance(event, FunctionToolCallEvent):
        return {"type": "tool_call", "tool_name": event.part.tool_name, "args": event.part.args}
    if isinstance(event, FunctionToolResultEvent):
        return {
            "type": "tool_result",
            "tool_name": getattr(event.part, "tool_name", None),
            "content": str(event.part.content)[:500],
        }
    return None
