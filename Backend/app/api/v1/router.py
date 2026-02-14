from fastapi import APIRouter
from app.api.v1.endpoints import dashboard, materials

api_router = APIRouter()

api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(materials.router, prefix="/materials", tags=["Materials"])
