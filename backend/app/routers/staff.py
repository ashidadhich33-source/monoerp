from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from datetime import datetime, date, timedelta
from app.models.base import get_db
from app.models.staff import Staff
from app.models.attendance import Attendance, AttendanceStatus
from app.models.sales import Sales
from app.models.rankings import Rankings, PeriodType
from app.models.salary import Salary
from app.models.targets import Targets
from app.models.achievements import Achievements
from app.routers.auth import get_current_staff
from app.utils.auth import verify_local_network, get_device_fingerprint
from pydantic import BaseModel

router = APIRouter()

class AttendanceRequest(BaseModel):
    mac_address: Optional[str] = None

class AttendanceResponse(BaseModel):
    id: int
    check_in_time: Optional[datetime]
    check_out_time: Optional[datetime]
    date: date
    status: str
    created_at: datetime

class SalesResponse(BaseModel):
    id: int
    brand_name: str
    sale_amount: float
    sale_date: date
    units_sold: int

class DashboardResponse(BaseModel):
    today_attendance: Optional[AttendanceResponse]
    personal_sales_today: float
    personal_sales_month: float
    current_target: Optional[dict]
    achievement_percentage: float
    quick_stats: dict

@router.get("/dashboard/{staff_id}")
async def get_dashboard(
    staff_id: int,
    request: Request,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Get staff dashboard data"""
    
    # Verify local network access
    if not verify_local_network(request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Not on local network"
        )
    
    # Verify staff can only access their own dashboard
    if current_staff.id != staff_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Can only access own dashboard"
        )
    
    today = date.today()
    
    # Get today's attendance
    today_attendance = db.query(Attendance).filter(
        Attendance.staff_id == staff_id,
        Attendance.date == today
    ).first()
    
    # Get today's sales
    today_sales = db.query(func.sum(Sales.sale_amount)).filter(
        Sales.staff_id == staff_id,
        Sales.sale_date == today
    ).scalar() or 0.0
    
    # Get current month sales
    month_start = today.replace(day=1)
    month_sales = db.query(func.sum(Sales.sale_amount)).filter(
        Sales.staff_id == staff_id,
        Sales.sale_date >= month_start,
        Sales.sale_date <= today
    ).scalar() or 0.0
    
    # Get current target
    current_target = db.query(Targets).filter(
        Targets.staff_id == staff_id,
        Targets.period_start <= today,
        Targets.period_end >= today,
        Targets.target_type == PeriodType.MONTHLY
    ).first()
    
    # Calculate achievement percentage
    achievement_percentage = 0.0
    if current_target:
        achievement_percentage = (month_sales / current_target.total_target_amount) * 100
    
    # Quick stats
    total_working_days = db.query(func.count(Attendance.id)).filter(
        Attendance.staff_id == staff_id,
        Attendance.status == AttendanceStatus.PRESENT,
        Attendance.date >= month_start
    ).scalar() or 0
    
    return DashboardResponse(
        today_attendance=AttendanceResponse(
            id=today_attendance.id,
            check_in_time=today_attendance.check_in_time,
            check_out_time=today_attendance.check_out_time,
            date=today_attendance.date,
            status=today_attendance.status.value,
            created_at=today_attendance.created_at
        ) if today_attendance else None,
        personal_sales_today=today_sales,
        personal_sales_month=month_sales,
        current_target={
            "total_target": current_target.total_target_amount,
            "period_start": current_target.period_start,
            "period_end": current_target.period_end
        } if current_target else None,
        achievement_percentage=achievement_percentage,
        quick_stats={
            "working_days": total_working_days,
            "basic_salary": current_staff.basic_salary,
            "incentive_percentage": current_staff.incentive_percentage
        }
    )

@router.post("/attendance/check-in")
async def check_in(
    attendance_data: AttendanceRequest,
    request: Request,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Staff check-in"""
    
    # Verify local network access
    if not verify_local_network(request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Not on local network"
        )
    
    today = date.today()
    
    # Check if already checked in today
    existing_attendance = db.query(Attendance).filter(
        Attendance.staff_id == current_staff.id,
        Attendance.date == today
    ).first()
    
    if existing_attendance and existing_attendance.check_in_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already checked in today"
        )
    
    # Create or update attendance record
    if existing_attendance:
        existing_attendance.check_in_time = datetime.now()
        existing_attendance.status = AttendanceStatus.PRESENT
        existing_attendance.wifi_mac_address = attendance_data.mac_address
        existing_attendance.ip_address = request.client.host
        existing_attendance.device_fingerprint = get_device_fingerprint(request)
        db.commit()
        return {"message": "Checked in successfully", "attendance_id": existing_attendance.id}
    else:
        new_attendance = Attendance(
            staff_id=current_staff.id,
            check_in_time=datetime.now(),
            date=today,
            wifi_mac_address=attendance_data.mac_address,
            ip_address=request.client.host,
            device_fingerprint=get_device_fingerprint(request),
            status=AttendanceStatus.PRESENT,
            created_at=datetime.now()
        )
        db.add(new_attendance)
        db.commit()
        db.refresh(new_attendance)
        return {"message": "Checked in successfully", "attendance_id": new_attendance.id}

@router.post("/attendance/check-out")
async def check_out(
    request: Request,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Staff check-out"""
    
    # Verify local network access
    if not verify_local_network(request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Not on local network"
        )
    
    today = date.today()
    
    # Find today's attendance
    attendance = db.query(Attendance).filter(
        Attendance.staff_id == current_staff.id,
        Attendance.date == today
    ).first()
    
    if not attendance:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No check-in record found for today"
        )
    
    if attendance.check_out_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already checked out today"
        )
    
    attendance.check_out_time = datetime.now()
    db.commit()
    
    return {"message": "Checked out successfully"}

@router.get("/attendance/history")
async def get_attendance_history(
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db),
    limit: int = 30
):
    """Get attendance history"""
    
    attendance_records = db.query(Attendance).filter(
        Attendance.staff_id == current_staff.id
    ).order_by(desc(Attendance.date)).limit(limit).all()
    
    return [
        AttendanceResponse(
            id=record.id,
            check_in_time=record.check_in_time,
            check_out_time=record.check_out_time,
            date=record.date,
            status=record.status.value,
            created_at=record.created_at
        ) for record in attendance_records
    ]

@router.get("/sales/personal")
async def get_personal_sales(
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
):
    """Get personal sales data"""
    
    query = db.query(Sales).filter(Sales.staff_id == current_staff.id)
    
    if start_date:
        query = query.filter(Sales.sale_date >= start_date)
    if end_date:
        query = query.filter(Sales.sale_date <= end_date)
    
    sales_records = query.order_by(desc(Sales.sale_date)).all()
    
    return [
        SalesResponse(
            id=record.id,
            brand_name=record.brand.brand_name,
            sale_amount=record.sale_amount,
            sale_date=record.sale_date,
            units_sold=record.units_sold
        ) for record in sales_records
    ]

@router.get("/sales/all-staff")
async def get_all_staff_sales(
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
):
    """Get all staff sales data"""
    
    query = db.query(Sales)
    
    if start_date:
        query = query.filter(Sales.sale_date >= start_date)
    if end_date:
        query = query.filter(Sales.sale_date <= end_date)
    
    sales_records = query.order_by(desc(Sales.sale_date)).all()
    
    return [
        {
            "id": record.id,
            "staff_name": record.staff.name,
            "brand_name": record.brand.brand_name,
            "sale_amount": record.sale_amount,
            "sale_date": record.sale_date,
            "units_sold": record.units_sold
        } for record in sales_records
    ]

@router.get("/rankings/{period_type}")
async def get_rankings(
    period_type: PeriodType,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Get rankings for specified period"""
    
    rankings = db.query(Rankings).filter(
        Rankings.period_type == period_type
    ).order_by(Rankings.rank_position).all()
    
    return [
        {
            "rank": ranking.rank_position,
            "staff_name": ranking.staff.name,
            "total_sales": ranking.total_sales,
            "period_date": ranking.period_date
        } for ranking in rankings
    ]

@router.get("/salary/details/{month_year}")
async def get_salary_details(
    month_year: str,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Get salary details for specific month"""
    
    salary = db.query(Salary).filter(
        Salary.staff_id == current_staff.id,
        Salary.month_year == month_year
    ).first()
    
    if not salary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Salary record not found for the specified month"
        )
    
    return {
        "month_year": salary.month_year,
        "basic_salary": salary.basic_salary,
        "working_days": salary.working_days,
        "present_days": salary.present_days,
        "sunday_count": salary.sunday_count,
        "salary_for_days": salary.salary_for_days,
        "target_incentive": salary.target_incentive,
        "basic_incentive": salary.basic_incentive,
        "gross_salary": salary.gross_salary,
        "advance_deduction": salary.advance_deduction,
        "net_salary": salary.net_salary,
        "payment_status": salary.payment_status.value,
        "payment_date": salary.payment_date
    }

@router.get("/targets/current")
async def get_current_targets(
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Get current targets"""
    
    today = date.today()
    targets = db.query(Targets).filter(
        Targets.staff_id == current_staff.id,
        Targets.period_start <= today,
        Targets.period_end >= today
    ).all()
    
    return [
        {
            "id": target.id,
            "target_type": target.target_type.value,
            "total_target_amount": target.total_target_amount,
            "brand_wise_targets": target.brand_wise_targets,
            "period_start": target.period_start,
            "period_end": target.period_end,
            "incentive_percentage": target.incentive_percentage
        } for target in targets
    ]

@router.get("/achievements")
async def get_achievements(
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Get achievements"""
    
    achievements = db.query(Achievements).filter(
        Achievements.staff_id == current_staff.id
    ).order_by(desc(Achievements.created_at)).all()
    
    return [
        {
            "id": achievement.id,
            "achieved_amount": achievement.achieved_amount,
            "achievement_percentage": achievement.achievement_percentage,
            "incentive_earned": achievement.incentive_earned,
            "period": achievement.period,
            "created_at": achievement.created_at
        } for achievement in achievements
    ]