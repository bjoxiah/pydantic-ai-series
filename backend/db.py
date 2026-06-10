from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy import text
from settings import settings

engine = create_engine(
    settings.database_url,
    echo=False,
    pool_pre_ping=True,
)


def check_db():
    with Session(engine) as session:
        session.exec(text("SELECT 1"))


def get_session():
    with Session(engine) as session:
        yield session