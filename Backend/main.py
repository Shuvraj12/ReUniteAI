"""
TRACE - Missing Person Identification Platform
FastAPI Backend with ML Facial Recognition
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from database import engine, Base
from routers import auth, cases, face_search, alerts, analytics, reports


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create all DB tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Database tables created")
    print("✅ TRACE backend running")
    yield
    # Shutdown
    await engine.dispose()
    print("🛑 TRACE backend shut down")


app = FastAPI(
    title="TRACE API",
    description="Missing Person Identification & Reunification Platform",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router,        prefix="/api/auth",      tags=["Authentication"])
app.include_router(cases.router,       prefix="/api/cases",     tags=["Cases"])
app.include_router(face_search.router, prefix="/api/search",    tags=["Face Search"])
app.include_router(alerts.router,      prefix="/api/alerts",    tags=["Alerts"])
app.include_router(analytics.router,   prefix="/api/analytics", tags=["Analytics"])
app.include_router(reports.router,     prefix="/api/reports",   tags=["Reports"])


@app.get("/")
async def root():
    return {
        "service": "TRACE API",
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}
