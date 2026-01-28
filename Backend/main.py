from fastapi import FastAPI
from app.api.v1.router import api_router
from contextlib import asynccontextmanager

from app.core.database import engine, Base
from app.core.logging import setup_logging
from app.core.middleware import LoggingMiddleware


# Lifespan event handler (startup + shutdown)
@asynccontextmanager
async def lifespan(app: FastAPI):
    # ---- Startup Logic ----
    # ✅ Setup logging first
    setup_logging()
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield

    # ---- Shutdown Logic ----
    await engine.dispose()

app = FastAPI(title="ELC-EHS AI", lifespan=lifespan)
app.add_middleware(LoggingMiddleware)

app.include_router(api_router, prefix="/api/v1")
