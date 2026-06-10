
from chonkie import TokenChunker
from crawlee.crawlers import PlaywrightCrawler, PlaywrightCrawlingContext
from graphiti_core import Graphiti
from graphiti_core.llm_client.openai_generic_client import OpenAIGenericClient
from graphiti_core.cross_encoder.openai_reranker_client import OpenAIRerankerClient
from graphiti_core.llm_client import LLMConfig
from graphiti_core.embedder.openai import OpenAIEmbedder, OpenAIEmbedderConfig
from pydantic_ai import Embedder
from pydantic_ai.embeddings.openai import OpenAIEmbeddingModel
from pydantic_ai.providers.openai import OpenAIProvider
from neo4j_db import driver as neo4j_driver


from settings import settings

EMBEDDING_MODEL = "text-embedding-3-small"

# --- Pydantic AI embedder (for our pgvector RAG) ---
embedder = Embedder(
    OpenAIEmbeddingModel(
        EMBEDDING_MODEL,
        provider=OpenAIProvider(
            base_url="https://openrouter.ai/api/v1",
            api_key=settings.open_router_key,
        ),
    )
)

# --- Graphiti (for Neo4j knowledge graph) ---
graphiti = Graphiti(
    uri=settings.neo4j_uri,
    user=settings.neo4j_user,
    password=settings.neo4j_password,
    llm_client=OpenAIGenericClient(
        config=LLMConfig(
            api_key=settings.open_router_key,
            base_url="https://openrouter.ai/api/v1",
            model="google/gemini-2.5-flash",
            small_model="google/gemini-2.5-flash",
        )
    ),
    embedder=OpenAIEmbedder(
        config=OpenAIEmbedderConfig(
            api_key=settings.open_router_key,
            base_url="https://openrouter.ai/api/v1",
            embedding_model=f"openai/{EMBEDDING_MODEL}",
        )
    ),
    cross_encoder=OpenAIRerankerClient(
        config=LLMConfig(
            api_key=settings.open_router_key,
            base_url="https://openrouter.ai/api/v1",
            model="google/gemini-2.5-flash",
        )
    ),
)

chunker = TokenChunker(
    chunk_size=512,
    chunk_overlap=50,
)


# --- embed ---
async def embed(text: str) -> list[float]:
    result = await embedder.embed_query(text)
    return list(result[0])


# --- crawl ---
async def crawl_url(url: str, max_pages: int = 10) -> str:
    collected = []
    crawler = PlaywrightCrawler(
        max_requests_per_crawl=max_pages,
        browser_launch_options={"args": ["--no-sandbox", "--disable-setuid-sandbox"]},
    )

    @crawler.router.default_handler
    async def handler(context: PlaywrightCrawlingContext):
        await context.enqueue_links()
        text = await context.page.inner_text("body")
        collected.append(text)

    await crawler.run([url])
    return "\n\n".join(collected)

# -- delete agent's knowledge from Neo4j ---
async def delete_neo4j_group(agent_id: str):
    async with neo4j_driver.session() as session:
        await session.run(
            "MATCH (n) WHERE n.group_id = $group_id DETACH DELETE n",
            group_id=agent_id
        )
