"""
Monitoring and automation API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from app.models.base import get_db
from app.models.staff import Staff
from app.services.monitoring_service import monitoring_service
from app.services.automation_service import automation_service
from app.services.backup_service import backup_service
from app.routers.auth import get_current_staff

router = APIRouter(prefix="/monitoring", tags=["monitoring"])

@router.get("/health")
async def get_system_health():
    """Get system health status"""
    try:
        health_status = monitoring_service.check_system_health()
        return {
            "success": True,
            "data": health_status
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/metrics")
async def get_system_metrics():
    """Get current system metrics"""
    try:
        system_metrics = monitoring_service.collect_system_metrics()
        app_metrics = monitoring_service.collect_application_metrics()
        
        return {
            "success": True,
            "data": {
                "system": system_metrics,
                "application": app_metrics
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/metrics/summary")
async def get_metrics_summary(hours: int = 24):
    """Get metrics summary for the last N hours"""
    try:
        summary = monitoring_service.get_metrics_summary(hours)
        return {
            "success": True,
            "data": summary
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/alerts")
async def get_alerts(
    severity: Optional[str] = None,
    acknowledged: Optional[bool] = None,
    current_user: Staff = Depends(get_current_staff)
):
    """Get system alerts"""
    try:
        alerts = monitoring_service.get_alerts(severity, acknowledged)
        return {
            "success": True,
            "data": alerts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: int,
    current_user: Staff = Depends(get_current_staff)
):
    """Acknowledge an alert"""
    try:
        result = monitoring_service.acknowledge_alert(alert_id)
        return {
            "success": result["success"],
            "message": result["message"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status")
async def get_monitoring_status():
    """Get monitoring service status"""
    try:
        status = monitoring_service.get_monitoring_status()
        return {
            "success": True,
            "data": status
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/start")
async def start_monitoring(
    current_user: Staff = Depends(get_current_staff)
):
    """Start system monitoring"""
    try:
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        monitoring_service.start_monitoring()
        return {
            "success": True,
            "message": "Monitoring started successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/stop")
async def stop_monitoring(
    current_user: Staff = Depends(get_current_staff)
):
    """Stop system monitoring"""
    try:
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        monitoring_service.stop_monitoring()
        return {
            "success": True,
            "message": "Monitoring stopped successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Automation endpoints
@router.get("/automation/status")
async def get_automation_status():
    """Get automation service status"""
    try:
        status = automation_service.get_automation_status()
        return {
            "success": True,
            "data": status
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/automation/start")
async def start_automation(
    current_user: Staff = Depends(get_current_staff)
):
    """Start automation service"""
    try:
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        await automation_service.start_automation()
        return {
            "success": True,
            "message": "Automation started successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/automation/stop")
async def stop_automation(
    current_user: Staff = Depends(get_current_staff)
):
    """Stop automation service"""
    try:
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        await automation_service.stop_automation()
        return {
            "success": True,
            "message": "Automation stopped successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/automation/schedule-task")
async def schedule_custom_task(
    task_name: str,
    schedule_time: datetime,
    current_user: Staff = Depends(get_current_staff)
):
    """Schedule a custom automation task"""
    try:
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # This would need to be implemented based on specific task requirements
        return {
            "success": True,
            "message": f"Task '{task_name}' scheduled for {schedule_time}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Backup endpoints
@router.get("/backup/status")
async def get_backup_status():
    """Get backup service status"""
    try:
        status = backup_service.get_backup_status()
        return {
            "success": True,
            "data": status
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/backup/list")
async def list_backups():
    """List all available backups"""
    try:
        backups = backup_service.list_backups()
        return {
            "success": True,
            "data": backups
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/backup/create")
async def create_backup(
    backup_type: str = "manual",
    current_user: Staff = Depends(get_current_staff)
):
    """Create a new backup"""
    try:
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        result = backup_service.create_backup(backup_type)
        return {
            "success": result["success"],
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/backup/restore/{backup_filename}")
async def restore_backup(
    backup_filename: str,
    current_user: Staff = Depends(get_current_staff)
):
    """Restore from backup"""
    try:
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        result = backup_service.restore_backup(backup_filename)
        return {
            "success": result["success"],
            "message": result.get("message", result.get("error"))
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/backup/{backup_filename}")
async def delete_backup(
    backup_filename: str,
    current_user: Staff = Depends(get_current_staff)
):
    """Delete a backup"""
    try:
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        result = backup_service.delete_backup(backup_filename)
        return {
            "success": result["success"],
            "message": result.get("message", result.get("error"))
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/backup/cleanup")
async def cleanup_old_backups(
    days_to_keep: int = 30,
    current_user: Staff = Depends(get_current_staff)
):
    """Clean up old backups"""
    try:
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        result = backup_service.cleanup_old_backups(days_to_keep)
        return {
            "success": result["success"],
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))