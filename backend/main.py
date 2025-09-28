from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.models.base import engine, Base
from app.config.settings import get_settings
from app.routers import auth, staff, admin
from app.services.scheduler_service import start_background_tasks, stop_background_tasks
from app.middleware.security import security_middleware_handler
from app.utils.error_handler import global_exception_handler
import os
import logging

# Get settings
settings = get_settings()

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/app.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Create necessary directories
os.makedirs(settings.excel_upload_path, exist_ok=True)
os.makedirs(settings.backup_path, exist_ok=True)
os.makedirs(settings.log_path, exist_ok=True)
os.makedirs(settings.temp_path, exist_ok=True)

# Create database tables
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")
except Exception as e:
    logger.error(f"Failed to create database tables: {e}")

app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description="A comprehensive staff attendance and sales management system with fraud prevention, automated salary calculation, and performance tracking capabilities."
)

# Add global exception handler
app.add_exception_handler(Exception, global_exception_handler)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=settings.cors_credentials,
    allow_methods=settings.cors_methods,
    allow_headers=settings.cors_headers,
)

# Security middleware
app.middleware("http")(security_middleware_handler)

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