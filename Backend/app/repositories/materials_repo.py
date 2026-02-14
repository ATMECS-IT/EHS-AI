from sqlalchemy.ext.asyncio import AsyncSession
from app.db.executor import SQLExecutor
from app.db.queries.material_queries import MaterialQueries


class MaterialRepository:

    def __init__(self, db):
        self.executor = SQLExecutor(db)

    async def get_materials_by_type(self, material_type: str):
        return await self.executor.fetch_all(
            MaterialQueries.GET_MASTER_BY_TYPE,
            {"material_type": material_type}
        )
    
    async def count_materials(self, material_type: str):
        result = await self.executor.fetch_one(
            MaterialQueries.COUNT_BY_TYPE,
            {"material_type": material_type}
        )
        return result["total"]

    async def get_materials(
        self,
        material_type: str,
        limit: int,
        offset: int
    ):
        return await self.executor.fetch_all(
            MaterialQueries.GET_BY_TYPE,
            {
                "material_type": material_type,
                "limit": limit,
                "offset": offset,
            }
        )

    