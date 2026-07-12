from dataclasses import dataclass
from datetime import timedelta

from temporalio import workflow
from temporalio.common import RetryPolicy
from temporalio.workflow import ActivityConfig

from pydantic_ai.durable_exec.temporal import TemporalAgent, PydanticAIWorkflow
from pydantic_ai.messages import ModelMessagesTypeAdapter
from pydantic_ai.usage import UsageLimits

from .planner import planner_agent
from .engineer import engineering_agent
from .setup import CodingDeps, get_model
from .streaming import make_event_stream_handler
from .activities import (
    stream_progress,
    create_sandbox,
    serve_web_build,
    save_plan,
    set_build_started,
    save_build_reasoning,
    save_build_result,
)


def _serialize_messages(result) -> list[dict]:
    return ModelMessagesTypeAdapter.dump_python(result.all_messages(), mode="json")


def _usage_dict(result) -> dict | None:
    try:
        u = result.usage
        return {"requests": u.requests, "input_tokens": u.input_tokens, "output_tokens": u.output_tokens}
    except Exception:
        return None


_agent_config = ActivityConfig(
    start_to_close_timeout=timedelta(minutes=10),
    heartbeat_timeout=timedelta(seconds=30),
    retry_policy=RetryPolicy(maximum_attempts=3, initial_interval=timedelta(seconds=3)),
)

_activity_retry = RetryPolicy(maximum_attempts=3, initial_interval=timedelta(seconds=1))

SUPPORTED_MODELS = {
    name: get_model(name)
    for name in [
        "google/gemini-3-flash-preview",
        "anthropic/claude-fable-5",
        "anthropic/claude-opus-4.7",
        "anthropic/claude-opus-4.8",
        "deepseek/deepseek-v4-pro",
        "openai/gpt-5.5",
        "openai/gpt-4.1-mini",
        "openai/gpt-4o-mini",
        "x-ai/grok-4.3",
    ]
}

temporal_planner_agent = TemporalAgent(
    wrapped=planner_agent,
    models=SUPPORTED_MODELS,
    event_stream_handler=make_event_stream_handler(),
    activity_config=_agent_config
)
temporal_engineering_agent = TemporalAgent(
    wrapped=engineering_agent,
    models=SUPPORTED_MODELS,
    event_stream_handler=make_event_stream_handler(),
    activity_config=_agent_config,
)


@dataclass
class WorkflowState:
    status: str = ""
    project_name: str = ""
    brief: str = ""
    preview_url: str = ""
    github_url: str = ""
    pr_url: str = ""


@workflow.defn
class AppBuildWorkflow(PydanticAIWorkflow):
    __pydantic_ai_agents__ = [temporal_planner_agent, temporal_engineering_agent]

    def __init__(self) -> None:
        self._project_name: str = ""
        self._brief: str = ""
        self._plan_approved: bool | None = None
        self._plan_feedback: str = ""
        self._preview_url: str = ""
        self._github_url: str = ""
        self._pr_url: str = ""
        self._build_summary: str = ""
        self._status: str = "planning"
        self._sandbox_id: str = ""
        self._message_seq: int = 0

    @workflow.run
    async def run(self, prompt: str, deps: CodingDeps) -> dict:
        project_id = deps.project_id

        self._status = "planning"
        await workflow.execute_activity(
            stream_progress, 
            args=[project_id, "planning", "started"],
            schedule_to_close_timeout=timedelta(seconds=10), 
            retry_policy=_activity_retry,
        )

        self._message_seq += 1
        deps.message_sequence = self._message_seq

        plan_result = await temporal_planner_agent.run(
            f"User request: {prompt}", 
            deps=deps, 
            model=deps.model_name,
        )
        self._project_name = plan_result.output.project_name
        self._brief = plan_result.output.brief

        await workflow.execute_activity(
            save_plan,
            args=[
                project_id, self._project_name, self._brief, 
                _serialize_messages(plan_result), _usage_dict(plan_result),
                self._message_seq, "plan"
            ],
            schedule_to_close_timeout=timedelta(seconds=30), 
            retry_policy=_activity_retry,
        )
        await workflow.execute_activity(
            stream_progress, 
            args=[project_id, "awaiting_plan_approval", "pending"],
            schedule_to_close_timeout=timedelta(seconds=10), 
            retry_policy=_activity_retry,
        )

        while True:
            self._status = "awaiting_plan_approval"
            self._plan_approved = None
            await workflow.wait_condition(lambda: self._plan_approved is not None)

            if self._plan_approved:
                break

            self._status = "revising_plan"
            self._message_seq += 1
            deps.message_sequence = self._message_seq

            plan_result = await temporal_planner_agent.run(
                f"The user rejected this plan with feedback: {self._plan_feedback}\nRevise accordingly.",
                deps=deps,
                model=deps.model_name,
                message_history=plan_result.all_messages(),
            )
            self._project_name = plan_result.output.project_name
            self._brief = plan_result.output.brief

            await workflow.execute_activity(
                save_plan,
                args=[
                    project_id, self._project_name, self._brief,
                    _serialize_messages(plan_result), _usage_dict(plan_result),
                    self._message_seq, "revision"
                ],
                schedule_to_close_timeout=timedelta(seconds=30), 
                retry_policy=_activity_retry,
            )
            await workflow.execute_activity(
                stream_progress, 
                args=[project_id, "awaiting_plan_approval", "pending"],
                schedule_to_close_timeout=timedelta(seconds=10), 
                retry_policy=_activity_retry,
            )

        self._status = "building"
        sandbox_id = await workflow.execute_activity(
            create_sandbox,
            args=[deps.user_id],
            schedule_to_close_timeout=timedelta(minutes=2),
            heartbeat_timeout=timedelta(seconds=30),
            retry_policy=_activity_retry,
        )
        self._sandbox_id = sandbox_id
        deps.sandbox_id = sandbox_id

        await workflow.execute_activity(
            set_build_started, 
            args=[project_id, sandbox_id],
            schedule_to_close_timeout=timedelta(seconds=10), 
            retry_policy=_activity_retry,
        )
        await workflow.execute_activity(
            stream_progress, 
            args=[project_id, "building", "started"],
            schedule_to_close_timeout=timedelta(seconds=10), 
            retry_policy=_activity_retry,
        )

        self._message_seq += 1
        deps.message_sequence = self._message_seq

        build_prompt = (
            f"Project name: {self._project_name}\n\n"
            f"Build this approved app plan:\n\n{self._brief}\n\n"
            + (f"Incorporate this feedback: {self._plan_feedback}\n\n" if self._plan_feedback else "")
            + "Follow all steps from the expo-app-builder skill. "
            "Use the project name above for the folder, repo, and app name — do not invent a different name. "
            "Run expo export --platform web to validate. "
            "Return a BuildResult with project_path, app_name, feature_branch_name, and commit_message."
        )
        build_result = await temporal_engineering_agent.run(
            build_prompt, 
            deps=deps, 
            model=deps.model_name,
            usage_limits=UsageLimits(request_limit=None),
        )

        project_path = build_result.output.project_path
        app_name = build_result.output.app_name

        await workflow.execute_activity(
            save_build_reasoning,
            args=[
                project_id, _serialize_messages(build_result), 
                _usage_dict(build_result), self._message_seq
            ],
            schedule_to_close_timeout=timedelta(seconds=30), 
            retry_policy=_activity_retry,
        )

        self._status = "publishing"
        self._github_url = build_result.output.repo_url
        self._pr_url = build_result.output.pr_url
        self._build_summary = build_result.output.summary

        await workflow.execute_activity(
            stream_progress, 
            args=[project_id, "publishing", "started"],
            schedule_to_close_timeout=timedelta(seconds=10), 
            retry_policy=_activity_retry,
        )

        try:
            serve_res = await workflow.execute_activity(
                serve_web_build,
                args=[sandbox_id, project_path, app_name],
                schedule_to_close_timeout=timedelta(minutes=10),
                heartbeat_timeout=timedelta(seconds=30),
                retry_policy=_activity_retry,
            )
            self._preview_url = serve_res.get("preview_url", "")
        except Exception:
            self._preview_url = ""

        await workflow.execute_activity(
            save_build_result,
            args=[
                project_id, self._preview_url, 
                self._github_url, self._pr_url,
                self._build_summary, self._message_seq
            ],
            schedule_to_close_timeout=timedelta(seconds=30), 
            retry_policy=_activity_retry,
        )

        self._status = "complete"
        await workflow.execute_activity(
            stream_progress, 
            args=[project_id, "complete", "finished"],
            schedule_to_close_timeout=timedelta(seconds=10), 
            retry_policy=_activity_retry,
        )

        return {
            "status": "complete",
            "project_name": self._project_name,
            "brief": self._brief,
            "preview_url": self._preview_url,
            "github_url": self._github_url,
            "pr_url": self._pr_url,
        }

    @workflow.signal
    async def approve_plan(self) -> None:
        self._plan_approved = True

    @workflow.signal
    async def reject_plan(self, feedback: str = "") -> None:
        self._plan_approved = False
        self._plan_feedback = feedback

    @workflow.query
    def state(self) -> WorkflowState:
        return WorkflowState(
            status=self._status,
            project_name=self._project_name,
            brief=self._brief,
            preview_url=self._preview_url,
            github_url=self._github_url,
            pr_url=self._pr_url,
        )
