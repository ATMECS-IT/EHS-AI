from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text


class SQLExecutor:
    """
    Central executor for running raw SQL queries.
    Works across SQLite/Postgres/AzureSQL.
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def fetch_all(self, query: str, params: dict):
        result = await self.db.execute(text(query), params)
        rows = result.mappings().all()
        return [dict(r) for r in rows]

    async def fetch_one(self, query: str, params: dict):
        result = await self.db.execute(text(query), params)
        row = result.mappings().first()
        return dict(row) if row else None

    async def execute(self, query: str, params: dict = None):
        await self.db.execute(text(query), params or {})
        await self.db.commit()
