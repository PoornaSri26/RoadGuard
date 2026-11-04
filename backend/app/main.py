from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
from app.api import reports, routing, websocket, analytics

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="RoadGuardian API",
    description="Road damage detection and safe route planning API",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(reports.router)
app.include_router(routing.router)
app.include_router(websocket.router)
app.include_router(analytics.router)


@app.get("/")
async def root():
    return {
        "message": "RoadGuardian API",
        "version": "2.0.0",
        "features": [
            "AI-powered damage detection",
            "ML-based risk scoring",
            "Real-time WebSocket updates",
            "Analytics dashboard",
            "User authentication"
        ],
        "endpoints": {
            "reports": "/reports",
            "routing": "/routing",
            "websocket": "/ws",
            "analytics": "/analytics"
        }
    }


@app.get("/health")
async def health():
    return {"status": "healthy", "version": "2.0.0"}
