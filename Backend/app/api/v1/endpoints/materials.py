from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.responses import SuccessResponse
from app.dependencies.deps import get_db
from app.schemas.raw_material import MaterialListResponse
from app.services.materials_service import MaterialService

router = APIRouter()


# @router.get("/")
# async def get_materials(db: AsyncSession = Depends(get_db)):
#     return await MaterialService(db).list_materials()



@router.get("/")
async def get_materials(
    material_type: str = Query(
        default="raw_material",
        description="raw_material | extenders"
    ),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    result = await MaterialService(db).list_materials(material_type,page=page,page_size=page_size)

    return SuccessResponse(
        data=result["data"],
        meta=result["meta"]
    )


