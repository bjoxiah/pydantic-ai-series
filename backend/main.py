import subprocess
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from inngest.fast_api import serve

load_dotenv()

import logfire

from db import check_db, engine
from ingestion import graphiti
from inngest_client import client
from inngest_functions import ingest_knowledge_fn
from neo4j_db import check_neo4j
from neo4j_db import driver as neo4j_driver
from routers.agents import router as agents_router
from routers.agui import router as agui_router
from routers.capabilities import router as capabilities_router
from routers.conversation import router as conversation_router
from routers.ingestion import router as ingestion_router
from settings import settings

logfire.configure(token=settings.log_fire_token)
logfire.instrument_pydantic_ai()


@asynccontextmanager
async def lifespan(app: FastAPI):
    subprocess.run(["alembic", "upgrade", "head"], check=True)
    check_db()
    await check_neo4j()
    try:
        await graphiti.build_indices_and_constraints()
    except Exception:
        pass
    yield
    engine.dispose()
    await neo4j_driver.close()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

serve(app, client, [ingest_knowledge_fn])

app.include_router(capabilities_router)
app.include_router(agents_router)
app.include_router(conversation_router)
app.include_router(ingestion_router)
app.include_router(agui_router)