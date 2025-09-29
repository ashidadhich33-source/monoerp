"""
Alerting API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from app.models.base import get_db
from app.models.staff import Staff
from app.services.alerting_service import alerting_service
from app.routers.auth import get_current_staff

router = APIRouter(prefix="/alerting", tags=["alerting"])

@router.get("/status")
async def get_alerting_status():
    """Get alerting service status"""
    try:
        status = alerting_service.get_alerting_status()
        return {
            "success": True,
            "data": status
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/rules")
async def get_alert_rules():
    """Get list of alert rules"""
    try:
        rules = list(alerting_service.alert_rules.values())
        return {
            "success": True,
            "data": rules
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/rules/create")
async def create_alert_rule(
    rule_name: str,
    rule_config: Dict[str, Any],
    current_user: Staff = Depends(get_current_staff)
):
    """Create a new alert rule"""
    try:
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        result = alerting_service.create_alert_rule(rule_name, rule_config)
        return {
            "success": result["success"],
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/alerts")
async def get_alert_history(
    limit: int = 100,
    severity: Optional[str] = None,
    acknowledged: Optional[bool] = None,
    resolved: Optional[bool] = None
):
    """Get alert history"""
    try:
        alerts = alerting_service.get_alert_history(limit)
        
        # Filter alerts based on parameters
        if severity:
            alerts = [a for a in alerts if a['severity'] == severity]
        
        if acknowledged is not None:
            alerts = [a for a in alerts if a['acknowledged'] == acknowledged]
        
        if resolved is not None:
            alerts = [a for a in alerts if a['resolved'] == resolved]
        
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
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        result = alerting_service.acknowledge_alert(alert_id)
        return {
            "success": result["success"],
            "message": result.get("message", result.get("error"))
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/alerts/{alert_id}/resolve")
async def resolve_alert(
    alert_id: int,
    current_user: Staff = Depends(get_current_staff)
):
    """Resolve an alert"""
    try:
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        result = alerting_service.resolve_alert(alert_id)
        return {
            "success": result["success"],
            "message": result.get("message", result.get("error"))
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/statistics")
async def get_alert_statistics():
    """Get alert statistics"""
    try:
        stats = alerting_service.get_alert_statistics()
        return {
            "success": True,
            "data": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/thresholds")
async def update_alert_thresholds(
    thresholds: Dict[str, Any],
    current_user: Staff = Depends(get_current_staff)
):
    """Update alert thresholds"""
    try:
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        result = alerting_service.update_alert_thresholds(thresholds)
        return {
            "success": result["success"],
            "message": result.get("message", result.get("error"))
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/start")
async def start_alerting(
    current_user: Staff = Depends(get_current_staff)
):
    """Start alerting service"""
    try:
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        alerting_service.start_alerting()
        return {
            "success": True,
            "message": "Alerting service started successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/stop")
async def stop_alerting(
    current_user: Staff = Depends(get_current_staff)
):
    """Stop alerting service"""
    try:
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        alerting_service.stop_alerting()
        return {
            "success": True,
            "message": "Alerting service stopped successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/test")
async def test_alerting(
    test_metrics: Dict[str, Any],
    current_user: Staff = Depends(get_current_staff)
):
    """Test alerting with sample metrics"""
    try:
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        triggered_alerts = alerting_service.evaluate_alert_rules(test_metrics)
        return {
            "success": True,
            "data": {
                "triggered_alerts": triggered_alerts,
                "test_metrics": test_metrics
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/rules/{rule_name}")
async def get_alert_rule_details(
    rule_name: str,
    current_user: Staff = Depends(get_current_staff)
):
    """Get details of a specific alert rule"""
    try:
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        if rule_name not in alerting_service.alert_rules:
            raise HTTPException(status_code=404, detail="Alert rule not found")
        
        rule = alerting_service.alert_rules[rule_name]
        return {
            "success": True,
            "data": rule
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/rules/{rule_name}/enable")
async def enable_alert_rule(
    rule_name: str,
    current_user: Staff = Depends(get_current_staff)
):
    """Enable an alert rule"""
    try:
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        if rule_name not in alerting_service.alert_rules:
            raise HTTPException(status_code=404, detail="Alert rule not found")
        
        alerting_service.alert_rules[rule_name]['enabled'] = True
        
        return {
            "success": True,
            "message": f"Alert rule '{rule_name}' enabled successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/rules/{rule_name}/disable")
async def disable_alert_rule(
    rule_name: str,
    current_user: Staff = Depends(get_current_staff)
):
    """Disable an alert rule"""
    try:
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        if rule_name not in alerting_service.alert_rules:
            raise HTTPException(status_code=404, detail="Alert rule not found")
        
        alerting_service.alert_rules[rule_name]['enabled'] = False
        
        return {
            "success": True,
            "message": f"Alert rule '{rule_name}' disabled successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/rules/{rule_name}")
async def delete_alert_rule(
    rule_name: str,
    current_user: Staff = Depends(get_current_staff)
):
    """Delete an alert rule"""
    try:
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        if rule_name not in alerting_service.alert_rules:
            raise HTTPException(status_code=404, detail="Alert rule not found")
        
        del alerting_service.alert_rules[rule_name]
        
        return {
            "success": True,
            "message": f"Alert rule '{rule_name}' deleted successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dashboard")
async def get_alerting_dashboard():
    """Get alerting dashboard data"""
    try:
        status = alerting_service.get_alerting_status()
        statistics = alerting_service.get_alert_statistics()
        recent_alerts = alerting_service.get_alert_history(10)
        
        return {
            "success": True,
            "data": {
                "status": status,
                "statistics": statistics,
                "recent_alerts": recent_alerts
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))