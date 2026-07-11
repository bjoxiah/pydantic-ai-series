from e2b import AsyncSandbox, CommandExitException
from dataclasses import dataclass
from pydantic_ai import FunctionToolset, RunContext
from pydantic_ai.capabilities import AbstractCapability

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
        
        async def check(sandbox: AsyncSandbox, path: str):
            check = await sandbox.commands.run(
                f"test -d {path} && echo EXISTS || echo MISSING",
                timeout=10,
            )
            if "MISSING" in check.stdout:
                return (
                    f"Error: directory '{path}' does not exist. "
                    "Check the project name and scaffold first if needed."
                )
        
        @toolset.tool
        async def run_command(ctx: RunContext[CodingDeps], cmd: str, cwd: str = "/home/user") -> str:
            """Run a command in the sandbox. Returns stdout + stderr combined.
            Non-zero exit codes are returned as readable errors so the agent
            can self-correct — they do NOT raise exceptions."""
            sandbox = await AsyncSandbox.connect(ctx.deps.sandbox_id)

            # verify cwd exists before running — gives the agent a clear error
            # instead of a cryptic sandbox failure
            verify = await check(sandbox, cwd)
            if verify is not None:
                return verify

            try:
                # background=True keeps the connection alive during long-running
                # silent commands (npm install, expo export) that would otherwise
                # cause RemoteProtocolError: Server disconnected on the HTTP transport
                proc = await sandbox.commands.run(cmd, cwd=cwd, timeout=0, background=True)
                result = await proc.wait()
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
    
    
    
