import asyncio
import sys
from pathlib import Path

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession

from settings import settings

engine = create_async_engine(
    settings.database_url.replace("postgresql://", "postgresql+asyncpg://"),
    echo=False,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


_ALEMBIC_INI = Path(__file__).parent.parent / "alembic.ini"


async def run_migrations() -> None:
    """Run Alembic migrations in a subprocess.

    Alembic's env.py calls asyncio.run() which would create a second event loop
    inside asyncio.to_thread(), causing asyncpg's C extension to crash.
    Running in a subprocess isolates all asyncio/asyncpg state entirely.
    """
    proc = await asyncio.create_subprocess_exec(
        sys.executable, "-m", "alembic", "upgrade", "head",
        cwd=str(_ALEMBIC_INI.parent),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    _, stderr = await proc.communicate()
    if proc.returncode != 0:
        raise RuntimeError(
            f"Alembic migration failed (exit {proc.returncode}):\n{stderr.decode()}"
        )
