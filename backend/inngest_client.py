import inngest
from settings import settings

client = inngest.Inngest(
    app_id="agent-builder",
    is_production=settings.inngest_is_production,  # False in dev
    event_api_base_url=settings.inngest_dev_server_url,  # only used in dev
    api_base_url=settings.inngest_dev_server_url,  # only used in dev
)