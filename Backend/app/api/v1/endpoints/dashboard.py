from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.deps import get_db


router = APIRouter()

@router.get("/overview")
async def get_overview(db: AsyncSession = Depends(get_db)):
   return db.__str__()