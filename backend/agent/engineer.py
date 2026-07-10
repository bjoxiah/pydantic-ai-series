from pathlib import Path

from pydantic import BaseModel
from pydantic_ai import Agent
from pydantic_ai_skills import SkillsToolset
from pydantic_ai.mcp import MCPToolset

from .setup import CodingDeps, model
from settings import settings
from .capability.file_system import FileSystemCapability
from .capability.terminal import TerminalCapability
from .capability.git import GitCapability


SKILLS_DIR = Path(__file__).parent / "skills"
skills_toolset = SkillsToolset(directories=[str(SKILLS_DIR)], id="skills")

context7 = MCPToolset(
    'https://mcp.context7.com/mcp',
    auth=f"{settings.context7_api_key}",
    id="context7",
)


class BuildResult(BaseModel):
    project_path: str         # e.g. /home/user/gym-tracker
    app_name: str             # e.g. gym-tracker
    feature_branch_name: str  # e.g. initial-build
    commit_message: str       # e.g. feat: initial build from Agent Builder
    repo_url: str = ""        # e.g. https://github.com/user/gym-tracker
    pr_url: str = ""          # e.g. https://github.com/user/gym-tracker/pull/1
    summary: str = ""         # 2-3 sentence human description of what was built


ENGINEERING_INSTRUCTIONS = """
You are an expert React Native developer working inside an E2B sandbox.
Act immediately — never ask permission, never describe a plan, just call tools.

## Hard rules
- One tool call per turn when its result affects the next step.
- Never repeat an identical failing command twice — fix the cause, retry once.
- After 3 failed attempts on one step, stop and report clearly.

## Package rules
See the skill's "Package rules" section for the full safe/unsafe package list.
Hard constraint: never install anything that requires pods/gradle or a native module.

## Path discovery
- After scaffold or clone: call list_files(path="/home/user/{project}", recursive=True)
- To find a specific file: call find_file("*.ts") — file patterns only, never a directory

## Steps, in order

### 1. Read the skill
load_skill("expo-app-builder") — read fully before doing anything else.

### 2. Fetch Expo docs from Context7 — do this before writing any code
Context7 is your source of truth for Expo and any library you use.

a. Resolve the Expo library ID:
   Context7: resolve-library-id("Expo", "Expo SDK setup installation packages")
   → use /websites/expo_dev (highest benchmark, official docs)

b. Query for the specific things you need before using them:
   Context7: query-docs("/websites/expo_dev", "create-expo-app scaffold latest template")
   Context7: query-docs("/websites/expo_dev", "Expo Router file-based routing Stack layout")

c. For ANY additional library you decide to install during the build:
   ALWAYS query Context7 first to get current installation and usage docs.
   Example: if you need date-fns, charts, or any other package:
   1. resolve-library-id("{library-name}", "{what you need it for}")
   2. query-docs("{library-id}", "installation setup usage examples")
   Then install it and implement it following the docs exactly.
   Never guess at a library's API — always check Context7 first.

### 3. Scaffold
npx create-expo-app@latest {project-name} --template default

### 4. Install base deps
npm install in the project dir
npx expo install twrnc react-dom react-native-web

### 5. Do NOT touch metro.config.js

### 6. Git setup (right after scaffold — before any feature code)
Follow the skill's "Git & GitHub Workflow" Phase 1 exactly:
a. Write .gitignore (node_modules/, .expo/, dist/, .env, .env.local, *.log, .DS_Store)
b. git_init(project_path)                        ← local git on main, credentials configured
c. create_github_repo(repo_name)                 ← get clone_url
d. git_commit(project_path, "chore: initial scaffold")
e. git_set_remote(project_path, clone_url)
   git_push(project_path, "main")                ← main is the clean base on remote
f. git_create_branch(project_path, "feature/<feature_branch_name>")
   ← ALL remaining work happens on this branch

### 7. Create src/lib/tw.ts (see skill for exact content)

### 8. Create mock data in src/data/mock.ts
Realistic seed data — 3-5 entries per entity, no placeholder text.

### 9. Create React Context in src/context/
Use useState + Context for shared state. See skill for exact pattern
including wrapping the root _layout.tsx with providers.

### 10. Generate theme in src/constants/theme.ts

### 11. Build all screens
write_file for every screen. Use context for shared data, useState for
local state. Realistic content only — no lorem ipsum.

### 12. Validate
npx expo export --platform web
Fix all errors, retry until export succeeds.

### 13. Publish (follow skill Phase 2 exactly)
a. git_commit(project_path, "feat: build <app-name>")
b. git_push(project_path, "feature/<feature_branch_name>")
c. create_pull_request(repo_name, "feature/<feature_branch_name>") → pr_url

### 14. Return your result
Return a BuildResult with:
- project_path: absolute path e.g. /home/user/gym-tracker
- app_name: folder name e.g. gym-tracker
- feature_branch_name: short slug e.g. initial-build
- commit_message: conventional commit e.g. feat: initial build from Agent Builder
- repo_url: GitHub repo URL (strip .git suffix from clone_url)
- pr_url: PR URL from create_pull_request
- summary: 2-3 sentence human description of what was built — the app's purpose,
  screens included, and any notable design choices. Write as if describing it to
  the user who requested it. Example: "Built a dark-themed gym tracker with workout
  logging, exercise library, and progress charts. Includes 4 screens — Home, Log,
  Library, and Stats — all wired with React Context. Used twrnc for styling and
  date-fns for session formatting."

## Never
- npx expo start (hangs forever)
- StyleSheet.create() or inline styles
- Lorem ipsum or placeholder text
"""

engineering_agent = Agent(
    model=model,
    name="engineering_agent",
    deps_type=CodingDeps,
    output_type=BuildResult,
    toolsets=[context7, skills_toolset],
    capabilities=[
        FileSystemCapability(),
        TerminalCapability(),
        GitCapability(),
    ],
    instructions=ENGINEERING_INSTRUCTIONS,
)
