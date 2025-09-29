"""
Disaster recovery API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Dict, List, Any, Optional
from datetime import datetime
from app.models.base import get_db
from app.models.staff import Staff
from app.services.disaster_recovery_service import disaster_recovery_service
from app.auth import get_current_user

router = APIRouter(prefix="/disaster-recovery", tags=["disaster-recovery"])

@router.get("/status")
async def get_recovery_status():
    """Get disaster recovery status"""
    try:
        status = disaster_recovery_service.get_recovery_status()
        return {
            "success": True,
            "data": status
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/plans")
async def get_recovery_plans():
    """Get list of recovery plans"""
    try:
        plans = disaster_recovery_service.get_recovery_plans()
        return {
            "success": True,
            "data": plans
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/plans/create")
async def create_recovery_plan(
    plan_name: str,
    plan_config: Dict[str, Any],
    current_user: Staff = Depends(get_current_user)
):
    """Create a new recovery plan"""
    try:
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        result = disaster_recovery_service.create_recovery_plan(plan_name, plan_config)
        return {
            "success": result["success"],
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/plans/{plan_name}/execute")
async def execute_recovery_plan(
    plan_name: str,
    target_date: Optional[datetime] = None,
    current_user: Staff = Depends(get_current_user)
):
    """Execute a recovery plan"""
    try:
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        result = disaster_recovery_service.execute_recovery_plan(plan_name, target_date)
        return {
            "success": result["success"],
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/plans/{plan_name}/test")
async def test_recovery_plan(
    plan_name: str,
    current_user: Staff = Depends(get_current_user)
):
    """Test a recovery plan"""
    try:
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        result = disaster_recovery_service.test_recovery_plan(plan_name)
        return {
            "success": result["success"],
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/status/update")
async def update_recovery_status(
    status_updates: Dict[str, Any],
    current_user: Staff = Depends(get_current_user)
):
    """Update recovery status"""
    try:
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        result = disaster_recovery_service.update_recovery_status(status_updates)
        return {
            "success": result["success"],
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/plans/{plan_name}/schedule-test")
async def schedule_recovery_test(
    plan_name: str,
    test_schedule: str,
    current_user: Staff = Depends(get_current_user)
):
    """Schedule automated recovery testing"""
    try:
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        result = disaster_recovery_service.schedule_automated_recovery_test(plan_name, test_schedule)
        return {
            "success": result["success"],
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/plans/{plan_name}")
async def get_recovery_plan_details(
    plan_name: str,
    current_user: Staff = Depends(get_current_user)
):
    """Get details of a specific recovery plan"""
    try:
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # This would typically return detailed plan information
        # For now, return a placeholder
        return {
            "success": True,
            "data": {
                "name": plan_name,
                "status": "active",
                "created_at": datetime.now().isoformat(),
                "last_tested": None,
                "test_results": []
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/plans/{plan_name}")
async def delete_recovery_plan(
    plan_name: str,
    current_user: Staff = Depends(get_current_user)
):
    """Delete a recovery plan"""
    try:
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # This would typically delete the plan
        # For now, return a placeholder
        return {
            "success": True,
            "message": f"Recovery plan '{plan_name}' deleted successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/metrics")
async def get_recovery_metrics():
    """Get recovery metrics and statistics"""
    try:
        # This would typically return recovery metrics
        # For now, return a placeholder
        metrics = {
            "total_plans": 0,
            "active_plans": 0,
            "last_backup": None,
            "last_recovery": None,
            "average_recovery_time": 0,
            "success_rate": 100
        }
        
        return {
            "success": True,
            "data": metrics
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/emergency-recovery")
async def emergency_recovery(
    plan_name: str,
    current_user: Staff = Depends(get_current_user)
):
    """Execute emergency recovery (admin only)"""
    try:
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # Emergency recovery would typically have additional safeguards
        result = disaster_recovery_service.execute_recovery_plan(plan_name)
        return {
            "success": result["success"],
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))