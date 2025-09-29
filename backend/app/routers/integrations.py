"""
External API integration endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Dict, List, Any, Optional
from app.models.base import get_db
from app.models.staff import Staff
from app.services.integration_service import integration_service
from app.auth import get_current_user

router = APIRouter(prefix="/integrations", tags=["integrations"])

@router.get("/status")
async def get_integration_status():
    """Get status of all integrations"""
    try:
        status = integration_service.get_integration_status()
        return {
            "success": True,
            "data": status
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/test/{integration_name}")
async def test_integration(
    integration_name: str,
    current_user: Staff = Depends(get_current_user)
):
    """Test a specific integration"""
    try:
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        result = integration_service.test_integration(integration_name)
        return {
            "success": result["success"],
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sms/send")
async def send_sms(
    phone_number: str,
    message: str,
    current_user: Staff = Depends(get_current_user)
):
    """Send SMS via external provider"""
    try:
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        result = await integration_service.send_sms(phone_number, message)
        return {
            "success": result["success"],
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/email/send")
async def send_email(
    to_email: str,
    subject: str,
    body: str,
    html_body: Optional[str] = None,
    current_user: Staff = Depends(get_current_user)
):
    """Send email via external provider"""
    try:
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        result = await integration_service.send_email(to_email, subject, body, html_body)
        return {
            "success": result["success"],
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/payment/process")
async def process_payment(
    amount: float,
    currency: str,
    payment_method: str,
    customer_info: Dict[str, Any],
    current_user: Staff = Depends(get_current_user)
):
    """Process payment via external provider"""
    try:
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        result = await integration_service.process_payment(
            amount, currency, payment_method, customer_info
        )
        return {
            "success": result["success"],
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analytics/event")
async def send_analytics_event(
    event_name: str,
    event_data: Dict[str, Any],
    current_user: Staff = Depends(get_current_user)
):
    """Send analytics event to external provider"""
    try:
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        result = await integration_service.send_analytics_event(event_name, event_data)
        return {
            "success": result["success"],
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/backup/upload")
async def upload_backup(
    file_path: str,
    backup_name: str,
    current_user: Staff = Depends(get_current_user)
):
    """Upload backup to cloud storage"""
    try:
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        result = await integration_service.upload_to_cloud_backup(file_path, backup_name)
        return {
            "success": result["success"],
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/providers")
async def get_available_providers():
    """Get list of available integration providers"""
    try:
        providers = {
            "sms": ["twilio", "textlocal"],
            "email": ["sendgrid", "mailgun"],
            "payment": ["stripe", "razorpay"],
            "analytics": ["google_analytics", "mixpanel"],
            "backup": ["aws_s3", "google_cloud"]
        }
        
        return {
            "success": True,
            "data": providers
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/config")
async def get_integration_config(
    current_user: Staff = Depends(get_current_user)
):
    """Get integration configuration (admin only)"""
    try:
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # Return configuration without sensitive data
        config = {}
        for integration_name, integration_config in integration_service.integrations.items():
            config[integration_name] = {
                'provider': integration_config['provider'],
                'enabled': integration_config['enabled'],
                'configured': bool(integration_config['api_key'])
            }
        
        return {
            "success": True,
            "data": config
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/bulk-sms")
async def send_bulk_sms(
    phone_numbers: List[str],
    message: str,
    current_user: Staff = Depends(get_current_user)
):
    """Send bulk SMS to multiple numbers"""
    try:
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        results = []
        for phone_number in phone_numbers:
            result = await integration_service.send_sms(phone_number, message)
            results.append({
                'phone_number': phone_number,
                'success': result['success'],
                'error': result.get('error')
            })
        
        return {
            "success": True,
            "data": {
                'total_sent': len(phone_numbers),
                'successful': len([r for r in results if r['success']]),
                'failed': len([r for r in results if not r['success']]),
                'results': results
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/bulk-email")
async def send_bulk_email(
    email_addresses: List[str],
    subject: str,
    body: str,
    html_body: Optional[str] = None,
    current_user: Staff = Depends(get_current_user)
):
    """Send bulk email to multiple addresses"""
    try:
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        results = []
        for email_address in email_addresses:
            result = await integration_service.send_email(email_address, subject, body, html_body)
            results.append({
                'email_address': email_address,
                'success': result['success'],
                'error': result.get('error')
            })
        
        return {
            "success": True,
            "data": {
                'total_sent': len(email_addresses),
                'successful': len([r for r in results if r['success']]),
                'failed': len([r for r in results if not r['success']]),
                'results': results
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/logs")
async def get_integration_logs(
    integration_name: Optional[str] = None,
    limit: int = 100,
    current_user: Staff = Depends(get_current_user)
):
    """Get integration logs"""
    try:
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # This would typically fetch logs from a logging service
        # For now, return a placeholder
        logs = [
            {
                'timestamp': '2024-01-01T10:00:00Z',
                'integration': 'sms',
                'action': 'send_sms',
                'status': 'success',
                'message': 'SMS sent successfully'
            }
        ]
        
        return {
            "success": True,
            "data": logs
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))