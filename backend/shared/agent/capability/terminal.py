import asyncio
import contextlib
from dataclasses import dataclass

from e2b import AsyncSandbox, CommandExitException
from pydantic_ai import FunctionToolset, RunContext
from pydantic_ai.capabilities import AbstractCapability
from temporalio import activity

from agent.setup import CodingDeps

_MAX_OUTPUT = 8_000  # Temporal payload limit; keep well under 2 MB


def _trim(text: str, limit: int = _MAX_OUTPUT) -> str:
    if len(text) <= limit:
        return text
    half = limit // 2
    return text[:half] + f"\n... [{len(text) - limit} chars omitted] ...\n" + text[-half:]


@dataclass
class TerminalCapability(AbstractCapability[CodingDeps]):
    id: str = 'terminal'

    def get_instructions(self) -> str:
        return (
            "Run terminal commands in the sandbox using run_command. "
            "Always check command output for errors before proceeding."
        )

    def get_toolset(self) -> FunctionToolset:
        toolset = FunctionToolset(id=self.id)

        @toolset.tool
        async def run_command(ctx: RunContext[CodingDeps], cmd: str, cwd: str = "/home/user") -> str:
            """Run a command in the sandbox. Returns stdout + stderr combined.
            Non-zero exit codes are returned as readable errors so the agent
            can self-correct — they do NOT raise exceptions."""
            sandbox = await AsyncSandbox.connect(ctx.deps.sandbox_id)

            try:
                proc = await sandbox.commands.run(cmd, cwd=cwd, timeout=0, background=True)

                # Heartbeat every 5 s so Temporal doesn't cancel long-running
                # commands (npm install, expo export, etc.) before they finish.
                async def _hb() -> None:
                    while True:
                        activity.heartbeat()
                        await asyncio.sleep(5)

                hb = asyncio.create_task(_hb())
                try:
                    result = await proc.wait()
                finally:
                    hb.cancel()
                    with contextlib.suppress(asyncio.CancelledError):
                        await hb

                output = result.stdout or ""
                if result.stderr:
                    output += f"\n[stderr]: {result.stderr}"
                return _trim(output) or "(no output)"
            except CommandExitException as e:
                raw = (
                    f"[exit code {e.exit_code}]\n"
                    f"[stdout]: {e.stdout or '(empty)'}\n"
                    f"[stderr]: {e.stderr or '(empty)'}\n"
                    "Read this error carefully, fix the root cause, and retry."
                )
                return _trim(raw)

        return toolset
