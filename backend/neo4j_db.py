from neo4j import AsyncGraphDatabase
from settings import settings

driver = AsyncGraphDatabase.driver(
    settings.neo4j_uri,
    auth=(settings.neo4j_user, settings.neo4j_password)
)


async def check_neo4j():
    async with driver.session() as session:
        await session.run("RETURN 1")