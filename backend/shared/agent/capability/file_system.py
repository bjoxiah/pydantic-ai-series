from dataclasses import dataclass
from e2b import AsyncSandbox
from pydantic_ai import FunctionToolset, RunContext
from pydantic_ai.capabilities import AbstractCapability

from agent.setup import CodingDeps

@dataclass
class FileSystemCapability(AbstractCapability[CodingDeps]):
    id: str = 'file_system'

    def get_instructions(self) -> str:
        return """You can read and write files in the sandbox.
        Always write complete file contents, never partial updates.
        After writing a file always verify it exists with read_file.
        If read_file returns an error, use find_file() to locate the correct path first."""

    def get_toolset(self) -> FunctionToolset:
        toolset = FunctionToolset(id=self.id)

        @toolset.tool
        async def write_file(ctx: RunContext[CodingDeps], path: str, content: str) -> str:
            """Write a file to the sandbox"""
            sandbox = await AsyncSandbox.connect(ctx.deps.sandbox_id)
            try:
                await sandbox.files.write(path, content)
                return f"Written: {path}"
            except Exception as e:
                return (
                    f"Error: could not write '{path}' — {type(e).__name__}: {e}. "
                    "Ensure the parent directory exists with run_command('mkdir -p <dir>') then retry."
                )

        @toolset.tool
        async def read_file(ctx: RunContext[CodingDeps], path: str) -> str:
            """Read a file from the sandbox"""
            sandbox = await AsyncSandbox.connect(ctx.deps.sandbox_id)
            try:
                content = await sandbox.files.read(path)
                return content
            except Exception as e:
                return (
                    f"Error: could not read '{path}' — {type(e).__name__}: {e}. "
                    "Use find_file() to locate the correct path, then retry."
                )

        @toolset.tool
        async def find_file(
            ctx: RunContext[CodingDeps],
            name_pattern: str,
            search_root: str = "/home/user",
        ) -> str:
            """Find files by name pattern anywhere under search_root.
            Use this after any CLI command that creates files to discover
            the actual path before trying to read or modify it.
            Example: find_file("*.sql") or find_file("migrations")"""
            sandbox = await AsyncSandbox.connect(ctx.deps.sandbox_id)

            try:
                result = await sandbox.commands.run(
                    f"find {search_root} -name '{name_pattern}' "
                    f"-not -path '*/node_modules/*' -not -path '*/.git/*'",
                    timeout=0,
                )
                return result.stdout.strip() or f"No files matching '{name_pattern}' found under {search_root}"
            except Exception as e:
                return f"Error: find_file failed — {type(e).__name__}: {e}."

        @toolset.tool
        async def list_files(
            ctx: RunContext[CodingDeps],
            path: str = "/home/user",
            recursive: bool = False,
        ) -> str:
            """List files in a directory. Returns full paths.
            Use recursive=True to get the full tree — useful after CLI commands
            that create files in unknown locations."""
            sandbox = await AsyncSandbox.connect(ctx.deps.sandbox_id)

            try:
                if recursive:
                    result = await sandbox.commands.run(
                        f"find {path} -not -path '*/node_modules/*' -not -path '*/.expo/*' "
                        f"-not -path '*/.git/*' -not -path '*/dist/*' -type f",
                        timeout=0,
                    )
                    return result.stdout or "No files found"
                else:
                    files = await sandbox.files.list(path)
                    return "\n".join([f"{path.rstrip('/')}/{f.name}" for f in files])
            except Exception as e:
                return f"Error: could not list '{path}' — {type(e).__name__}: {e}."

        @toolset.tool
        async def delete_file(ctx: RunContext[CodingDeps], path: str) -> str:
            """Delete a file from the sandbox"""
            sandbox = await AsyncSandbox.connect(ctx.deps.sandbox_id)
            try:
                await sandbox.files.remove(path)
                return f"Deleted: {path}"
            except Exception as e:
                return f"Error: could not delete '{path}' — {type(e).__name__}: {e}."

        return toolset
