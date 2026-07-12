import asyncio
import contextlib
from dataclasses import dataclass

import httpx
from e2b import AsyncSandbox, CommandExitException
from pydantic_ai import FunctionToolset, RunContext
from pydantic_ai.capabilities import AbstractCapability
from temporalio import activity

from agent.setup import CodingDeps
from db.engine import AsyncSessionLocal
from db.queries import get_settings


async def _with_heartbeat(coro) -> any:
    """Run coro while heartbeating Temporal every 5 s."""
    async def _hb() -> None:
        while True:
            activity.heartbeat()
            await asyncio.sleep(5)

    hb = asyncio.create_task(_hb())
    try:
        return await coro
    finally:
        hb.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await hb


# ── Sandbox git identity setup ────────────────────────────────────────────────

async def _setup_git_identity(sandbox: AsyncSandbox) -> None:
    """Set git global user identity from sandbox env vars. No credentials stored."""
    try:
        await sandbox.commands.run(
            'git config --global user.name "Forge"', timeout=0,
        )
        await sandbox.commands.run(
            'git config --global user.email "$GITHUB_EMAIL"', timeout=0,
        )
    except Exception:
        pass  # non-fatal — identity can be set later


# ── Capability ────────────────────────────────────────────────────────────────

@dataclass
class GitCapability(AbstractCapability[CodingDeps]):
    id: str = "git"

    def get_instructions(self) -> str:
        return """
## Git & GitHub — follow the skill's Git & GitHub Workflow section exactly

Git is set up immediately after scaffold. ALL feature work happens on the feature branch.

### Phase 1 (right after scaffold + base deps)
3. Write .gitignore, then git_init(project_path)     — local git on main, no remote yet
4. create_github_repo(repo_name)                      → clone_url
5. git_commit(project_path, "chore: initial scaffold")
6. git_set_remote(project_path, clone_url)
   git_push(project_path, "main")                    → main is clean base on remote
7. git_create_branch(project_path, "feature/<name>") → all build work from here

### Phase 2 (after expo export passes)
10. git_commit(project_path, "feat: build <app-name>")
11. git_push(project_path, "feature/<name>")
12. create_pull_request(repo_name, "feature/<name>") → pr_url

Include repo_url (clone_url without .git) and pr_url in BuildResult.
If any step fails with a clear error, fix and retry once — never skip.
"""

    def get_toolset(self) -> FunctionToolset:
        toolset = FunctionToolset(id=self.id)

        @toolset.tool
        async def create_github_repo(ctx: RunContext[CodingDeps], repo_name: str) -> str:
            """Create a GitHub repo and return its clone URL. Visibility (public/private) is set by the user's settings. Idempotent — returns existing URL if repo exists."""
            async with AsyncSessionLocal() as session:
                user_settings = await get_settings(session, ctx.deps.user_id)
            headers = {
                "Authorization": f"token {user_settings.github_token}",
                "Accept": "application/vnd.github.v3+json",
            }
            username = user_settings.github_username
            private = user_settings.github_repo_private
            async with httpx.AsyncClient() as client:
                check = await client.get(
                    f"https://api.github.com/repos/{username}/{repo_name}",
                    headers=headers,
                )
                if check.status_code == 200:
                    return f"Repo exists: {check.json()['clone_url']}"

                res = await client.post(
                    "https://api.github.com/user/repos",
                    headers=headers,
                    json={"name": repo_name, "private": private, "auto_init": False},
                )
                if res.status_code == 201:
                    return f"Created repo: {res.json()['clone_url']}"
                return f"Failed: {res.json().get('message', res.text[:200])}"

        @toolset.tool
        async def git_init(ctx: RunContext[CodingDeps], project_path: str) -> str:
            """Initialize git on main branch and set git identity."""
            sandbox = await AsyncSandbox.connect(ctx.deps.sandbox_id)
            try:
                await sandbox.commands.run(
                    "git init -b main 2>/dev/null || git checkout main 2>/dev/null || git branch -M main",
                    cwd=project_path, timeout=0,
                )
                await _setup_git_identity(sandbox)
                return f"Git initialised in {project_path}"
            except CommandExitException as e:
                return f"Error: git init failed (exit {e.exit_code}): {e.stderr or e.stdout or str(e)}"
            except Exception as e:
                return f"Error: git init failed — {type(e).__name__}: {e}"

        @toolset.tool
        async def git_set_remote(ctx: RunContext[CodingDeps], project_path: str, repo_url: str) -> str:
            """Point origin at repo_url. $GITHUB_USERNAME and $GITHUB_TOKEN are read
            directly from the sandbox environment — never touched by the Python process."""
            sandbox = await AsyncSandbox.connect(ctx.deps.sandbox_id)
            gh_path = repo_url.removeprefix("https://github.com/")
            try:
                await sandbox.commands.run(
                    f'git remote add origin "https://$GITHUB_USERNAME:$GITHUB_TOKEN@github.com/{gh_path}" 2>/dev/null'
                    f' || git remote set-url origin "https://$GITHUB_USERNAME:$GITHUB_TOKEN@github.com/{gh_path}"',
                    cwd=project_path, timeout=0,
                )
                return "Remote origin set (authenticated)"
            except CommandExitException as e:
                return f"Error: git remote failed (exit {e.exit_code}): {e.stderr or e.stdout or str(e)}"
            except Exception as e:
                return f"Error: git remote failed — {type(e).__name__}: {e}"

        @toolset.tool
        async def git_commit(ctx: RunContext[CodingDeps], project_path: str, message: str) -> str:
            """Stage all changes and commit. Use conventional commits (feat:, fix:, chore:)."""
            sandbox = await AsyncSandbox.connect(ctx.deps.sandbox_id)
            try:
                await sandbox.git.add(project_path)
                await sandbox.git.commit(
                    project_path, message,
                    author_name="Forge", author_email="forge@builder.dev",
                )
                return f"Committed: {message}"
            except CommandExitException as e:
                return f"Error: git commit failed (exit {e.exit_code}): {e.stderr or e.stdout or str(e)}"
            except Exception as e:
                return f"Error: git commit failed — {type(e).__name__}: {e}. Check git status with run_command('git status', cwd='{project_path}')."

        @toolset.tool
        async def git_create_branch(ctx: RunContext[CodingDeps], project_path: str, branch_name: str) -> str:
            """Create and switch to branch_name. Idempotent — resets branch if it already exists."""
            sandbox = await AsyncSandbox.connect(ctx.deps.sandbox_id)
            try:
                await sandbox.commands.run(
                    f"git checkout -B {branch_name}",
                    cwd=project_path, timeout=0,
                )
                return f"On branch: {branch_name}"
            except CommandExitException as e:
                return f"Error: git branch failed (exit {e.exit_code}): {e.stderr or e.stdout or str(e)}"
            except Exception as e:
                return f"Error: git branch failed — {type(e).__name__}: {e}"

        @toolset.tool
        async def git_push(ctx: RunContext[CodingDeps], project_path: str, branch: str) -> str:
            """Push branch to origin using sandbox env var credentials. Always specify branch explicitly."""
            sandbox = await AsyncSandbox.connect(ctx.deps.sandbox_id)
            try:
                await _with_heartbeat(sandbox.commands.run(
                    f"git push --set-upstream origin {branch}",
                    cwd=project_path, timeout=0,
                ))
                return f"Pushed origin/{branch}"
            except CommandExitException as e:
                return f"Push failed (exit {e.exit_code}): {e.stderr or e.stdout or str(e)}"
            except Exception as e:
                return f"Push failed — {type(e).__name__}: {e}"

        @toolset.tool
        async def create_pull_request(
            ctx: RunContext[CodingDeps],
            repo_name: str,
            head_branch: str,
            base_branch: str = "main",
            title: str = "",
            body: str = "",
        ) -> str:
            """Open a PR from head_branch into base_branch. Returns the PR URL.
            Idempotent — returns existing PR URL if one already exists."""
            async with AsyncSessionLocal() as session:
                user_settings = await get_settings(session, ctx.deps.user_id)
            headers = {
                "Authorization": f"token {user_settings.github_token}",
                "Accept": "application/vnd.github.v3+json",
            }
            username = user_settings.github_username
            async with httpx.AsyncClient() as client:
                existing = await client.get(
                    f"https://api.github.com/repos/{username}/{repo_name}/pulls",
                    headers=headers,
                    params={
                        "head": f"{username}:{head_branch}",
                        "base": base_branch,
                        "state": "open",
                    },
                )
                if existing.status_code == 200 and existing.json():
                    return f"PR exists: {existing.json()[0]['html_url']}"

                res = await client.post(
                    f"https://api.github.com/repos/{username}/{repo_name}/pulls",
                    headers=headers,
                    json={
                        "title": title or f"feat: {head_branch}",
                        "head": head_branch,
                        "base": base_branch,
                        "body": body or "Built automatically by Agent Builder. CodeRabbit will review.",
                    },
                )
                if res.status_code == 201:
                    return f"PR created: {res.json()['html_url']}"
                return f"PR failed: {res.text[:300]}"

        @toolset.tool
        async def git_clone(ctx: RunContext[CodingDeps], repo_url: str, project_path: str) -> str:
            """Clone a repository into the sandbox. Used for amendment workflows."""
            sandbox = await AsyncSandbox.connect(ctx.deps.sandbox_id)
            await _setup_git_identity(sandbox)
            gh_path = repo_url.removeprefix("https://github.com/")
            try:
                result = await _with_heartbeat(sandbox.commands.run(
                    f'git clone "https://$GITHUB_USERNAME:$GITHUB_TOKEN@github.com/{gh_path}" {project_path}',
                    timeout=0,
                ))
                if result.exit_code != 0:
                    return f"Error: clone failed (exit {result.exit_code}): {result.stderr[:300]}"
                return f"Cloned {repo_url} → {project_path}"
            except CommandExitException as e:
                return f"Error: clone failed (exit {e.exit_code}): {e.stderr or e.stdout or str(e)}"
            except Exception as e:
                return f"Error: clone failed — {type(e).__name__}: {e}"

        return toolset
