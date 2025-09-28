from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.models.base import engine, Base
from app.config.settings import get_settings
from app.routers import auth, staff, admin
from app.services.scheduler_service import start_background_tasks, stop_background_tasks
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)

# Create upload directories
settings = get_settings()
os.makedirs(settings.excel_upload_path, exist_ok=True)
os.makedirs(settings.backup_path, exist_ok=True)

app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description="A comprehensive staff attendance and sales management system with fraud prevention, automated salary calculation, and performance tracking capabilities."
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(staff.router, prefix="/api/staff", tags=["Staff Panel"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin Panel"])

@app.on_event("startup")
async def startup_event():
    """Start background tasks on application startup"""
    start_background_tasks()
    logger.info("Application started with background tasks")

@app.on_event("shutdown")
async def shutdown_event():
    """Stop background tasks on application shutdown"""
    stop_background_tasks()
    logger.info("Application shutdown with background tasks stopped")

@app.get("/")
async def root():
    return {
        "message": "Staff Attendance & Payout System API",
        "version": settings.version,
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)