from datetime import datetime, timezone
import uuid
from sqlmodel import JSON, SQLModel, Field
from sqlalchemy import Column
from pgvector.sqlalchemy import Vector

class AgentModel(SQLModel, table=True):
    __tablename__ = "agents"
    
    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
    )
    name: str
    instructions: str
    model_name: str
    capability_ids: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    ingestion_status: str = Field(default="ready")
    company_name: str | None = Field(default=None)
    theme: dict = Field(default_factory=dict, sa_column=Column(JSON)) 
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class KnowledgeChunk(SQLModel, table=True):
    __tablename__ = "knowledge_chunks"
    
    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
    )
    agent_id: uuid.UUID = Field(foreign_key="agents.id")
    content: str
    embedding: list[float] = Field(sa_column=Column(Vector(1536)))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
class Conversation(SQLModel, table=True):
    __tablename__ = "conversations"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    agent_id: uuid.UUID = Field(foreign_key="agents.id")
    title: str = Field(default="New conversation")
    messages_json: list = Field(default_factory=list, sa_column=Column(JSON))
    # user identity
    user_name: str | None = Field(default=None)
    user_email: str | None = Field(default=None)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))