from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from datetime import datetime, date, timedelta
import logging
from app.models.base import get_db
from app.models.staff import Staff
from app.models.attendance import Attendance, AttendanceStatus
from app.models.sales import Sales
from app.models.brands import Brands
from app.models.targets import Targets, TargetType
from app.models.achievements import Achievements
from app.models.salary import Salary, PaymentStatus
from app.models.advances import Advances, AdvanceStatus, DeductionPlan
from app.models.rankings import Rankings, PeriodType
from app.routers.auth import get_current_staff
from app.middleware.security import verify_local_network
from app.utils.auth import get_password_hash
from app.services.salary_service import salary_service
from app.services.backup_service import BackupService
from app.services.file_service import file_service
from app.services.excel_service import excel_service
from app.services.notification_service import notification_service
from pydantic import BaseModel
import openpyxl
import os
from app.config.settings import get_settings

router = APIRouter()
settings = get_settings()
logger = logging.getLogger(__name__)

@router.get("/company-info")
async def get_company_info(
    request: Request,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Get company information for salary slips and reports"""
    
    # Verify local network access
    if not verify_local_network(request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Not on local network"
        )
    
    # Verify admin access
    if not current_staff.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # For now, return default company info
    # In a real application, this would come from a company settings table
    company_info = {
        "name": "Your Company Name",
        "address": "Company Address, City, State, ZIP",
        "phone": "+1 (555) 123-4567",
        "email": "hr@company.com",
        "website": "www.company.com",
        "logo_url": None
    }
    
    return company_info

@router.get("/dashboard")
async def get_admin_dashboard(
    request: Request,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Get admin dashboard data"""
    
    # Verify local network access
    if not verify_local_network(request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Not on local network"
        )
    
    # Verify admin access
    if not current_staff.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        # Get basic statistics
        total_staff = db.query(func.count(Staff.id)).filter(Staff.is_active == True).scalar() or 0
        total_sales_today = db.query(func.sum(Sales.sale_amount)).filter(
            Sales.sale_date == date.today()
        ).scalar() or 0.0
        total_sales_month = db.query(func.sum(Sales.sale_amount)).filter(
            Sales.sale_date >= date.today().replace(day=1)
        ).scalar() or 0.0
        
        pending_salaries = db.query(func.count(Salary.id)).filter(
            Salary.payment_status == PaymentStatus.PENDING
        ).scalar() or 0
        
        active_advances = db.query(func.count(Advances.id)).filter(
            Advances.status == AdvanceStatus.ACTIVE
        ).scalar() or 0
        
        # Get attendance rate for today
        total_attendance_today = db.query(func.count(Attendance.id)).filter(
            Attendance.date == date.today(),
            Attendance.status == AttendanceStatus.PRESENT
        ).scalar() or 0
        
        attendance_rate = (total_attendance_today / total_staff * 100) if total_staff > 0 else 0
        
        return {
            "message": "Welcome to the admin dashboard!",
            "total_staff": total_staff,
            "total_sales_today": total_sales_today,
            "total_sales_month": total_sales_month,
            "pending_salaries": pending_salaries,
            "active_advances": active_advances,
            "attendance_rate": round(attendance_rate, 2),
            "system_health": "OK"
        }
        
    except Exception as e:
        logger.error(f"Failed to get admin dashboard data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to load dashboard data"
        )

# Pydantic models for request/response
class StaffCreate(BaseModel):
    employee_code: str
    name: str
    email: str
    password: str
    phone: Optional[str] = None
    basic_salary: float
    incentive_percentage: float
    department: Optional[str] = None
    joining_date: date

class StaffUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    basic_salary: Optional[float] = None
    incentive_percentage: Optional[float] = None
    department: Optional[str] = None
    is_active: Optional[bool] = None

class SalesCreate(BaseModel):
    staff_id: int
    brand_id: int
    sale_amount: float
    sale_date: date
    units_sold: int = 1

class TargetCreate(BaseModel):
    staff_id: int
    target_type: TargetType
    total_target_amount: float
    brand_wise_targets: Optional[dict] = None
    period_start: date
    period_end: date
    incentive_percentage: float

class AdvanceCreate(BaseModel):
    staff_id: int
    advance_amount: float
    reason: Optional[str] = None
    issue_date: date
    deduction_plan: DeductionPlan
    monthly_deduction_amount: Optional[float] = None

class BrandCreate(BaseModel):
    brand_name: str
    brand_code: str
    description: Optional[str] = None
    category: Optional[str] = None

class BrandUpdate(BaseModel):
    brand_name: Optional[str] = None
    brand_code: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None

class AdvanceUpdate(BaseModel):
    deduction_plan: Optional[DeductionPlan] = None
    monthly_deduction_amount: Optional[float] = None
    status: Optional[AdvanceStatus] = None

# Staff Management
@router.get("/staff/list")
async def get_staff_list(
    request: Request,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """Get list of all staff"""
    
    # Verify local network access
    if not verify_local_network(request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Not on local network"
        )
    
    staff_list = db.query(Staff).offset(skip).limit(limit).all()
    
    return [
        {
            "id": staff.id,
            "employee_code": staff.employee_code,
            "name": staff.name,
            "email": staff.email,
            "phone": staff.phone,
            "basic_salary": staff.basic_salary,
            "incentive_percentage": staff.incentive_percentage,
            "department": staff.department,
            "joining_date": staff.joining_date,
            "is_active": staff.is_active,
            "created_at": staff.created_at
        } for staff in staff_list
    ]

@router.post("/staff/create")
async def create_staff(
    staff_data: StaffCreate,
    request: Request,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Create new staff member"""
    
    # Verify local network access
    if not verify_local_network(request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Not on local network"
        )
    
    # Check if employee code already exists
    existing_staff = db.query(Staff).filter(Staff.employee_code == staff_data.employee_code).first()
    if existing_staff:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee code already exists"
        )
    
    # Check if email already exists
    existing_email = db.query(Staff).filter(Staff.email == staff_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )
    
    # Create new staff
    new_staff = Staff(
        employee_code=staff_data.employee_code,
        name=staff_data.name,
        email=staff_data.email,
        password_hash=get_password_hash(staff_data.password),
        phone=staff_data.phone,
        basic_salary=staff_data.basic_salary,
        incentive_percentage=staff_data.incentive_percentage,
        department=staff_data.department,
        joining_date=staff_data.joining_date,
        is_active=True,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    
    db.add(new_staff)
    db.commit()
    db.refresh(new_staff)
    
    return {"message": "Staff created successfully", "staff_id": new_staff.id}

@router.put("/staff/update/{staff_id}")
async def update_staff(
    staff_id: int,
    staff_data: StaffUpdate,
    request: Request,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Update staff member"""
    
    # Verify local network access
    if not verify_local_network(request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Not on local network"
        )
    
    staff = db.query(Staff).filter(Staff.id == staff_id).first()
    if not staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff not found"
        )
    
    # Update fields
    update_data = staff_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(staff, field, value)
    
    staff.updated_at = datetime.now()
    db.commit()
    
    return {"message": "Staff updated successfully"}

@router.delete("/staff/delete/{staff_id}")
async def delete_staff(
    staff_id: int,
    request: Request,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Delete staff member (soft delete)"""
    
    # Verify local network access
    if not verify_local_network(request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Not on local network"
        )
    
    staff = db.query(Staff).filter(Staff.id == staff_id).first()
    if not staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff not found"
        )
    
    # Soft delete
    staff.is_active = False
    staff.updated_at = datetime.now()
    db.commit()
    
    return {"message": "Staff deleted successfully"}

# Sales Management
@router.post("/sales/add")
async def add_sales(
    sales_data: SalesCreate,
    request: Request,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Add sales record"""
    
    # Verify local network access
    if not verify_local_network(request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Not on local network"
        )
    
    # Verify staff exists
    staff = db.query(Staff).filter(Staff.id == sales_data.staff_id).first()
    if not staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff not found"
        )
    
    # Verify brand exists
    brand = db.query(Brands).filter(Brands.id == sales_data.brand_id).first()
    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brand not found"
        )
    
    # Create sales record
    new_sales = Sales(
        staff_id=sales_data.staff_id,
        brand_id=sales_data.brand_id,
        sale_amount=sales_data.sale_amount,
        sale_date=sales_data.sale_date,
        units_sold=sales_data.units_sold,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    
    db.add(new_sales)
    db.commit()
    db.refresh(new_sales)
    
    return {"message": "Sales record added successfully", "sales_id": new_sales.id}

@router.post("/sales/bulk-upload")
async def bulk_upload_sales(
    request: Request,
    file: UploadFile = File(...),
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Bulk upload sales from Excel file"""
    
    # Verify local network access
    if not verify_local_network(request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Not on local network"
        )
    
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an Excel file"
        )
    
    # Save uploaded file
    file_path = os.path.join(settings.excel_upload_path, file.filename)
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    try:
        # Read Excel file
        workbook = openpyxl.load_workbook(file_path)
        worksheet = workbook.active
        
        # Process rows (assuming first row is header)
        rows_processed = 0
        errors = []
        
        for row in worksheet.iter_rows(min_row=2, values_only=True):
            try:
                # Extract data from row
                sale_date, staff_name, brand_name, sale_amount, units_sold = row[:5]
                
                # Find staff by name
                staff = db.query(Staff).filter(Staff.name == staff_name).first()
                if not staff:
                    errors.append(f"Staff not found: {staff_name}")
                    continue
                
                # Find brand by name
                brand = db.query(Brands).filter(Brands.brand_name == brand_name).first()
                if not brand:
                    errors.append(f"Brand not found: {brand_name}")
                    continue
                
                # Create sales record
                new_sales = Sales(
                    staff_id=staff.id,
                    brand_id=brand.id,
                    sale_amount=float(sale_amount),
                    sale_date=sale_date,
                    units_sold=int(units_sold) if units_sold else 1,
                    created_at=datetime.now(),
                    updated_at=datetime.now()
                )
                
                db.add(new_sales)
                rows_processed += 1
                
            except Exception as e:
                errors.append(f"Error processing row: {str(e)}")
                continue
        
        db.commit()
        
        return {
            "message": f"Bulk upload completed. {rows_processed} records processed.",
            "rows_processed": rows_processed,
            "errors": errors
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error processing Excel file: {str(e)}"
        )
    finally:
        # Clean up uploaded file
        if os.path.exists(file_path):
            os.remove(file_path)

@router.get("/sales/report")
async def get_sales_report(
    request: Request,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
):
    """Get sales report"""
    
    # Verify local network access
    if not verify_local_network(request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Not on local network"
        )
    
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
            "units_sold": record.units_sold,
            "created_at": record.created_at
        } for record in sales_records
    ]

# Target Management
@router.post("/targets/set")
async def set_target(
    target_data: TargetCreate,
    request: Request,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Set target for staff"""
    
    # Verify local network access
    if not verify_local_network(request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Not on local network"
        )
    
    # Verify staff exists
    staff = db.query(Staff).filter(Staff.id == target_data.staff_id).first()
    if not staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff not found"
        )
    
    # Create target
    new_target = Targets(
        staff_id=target_data.staff_id,
        target_type=target_data.target_type,
        total_target_amount=target_data.total_target_amount,
        brand_wise_targets=target_data.brand_wise_targets,
        period_start=target_data.period_start,
        period_end=target_data.period_end,
        incentive_percentage=target_data.incentive_percentage,
        created_at=datetime.now()
    )
    
    db.add(new_target)
    db.commit()
    db.refresh(new_target)
    
    return {"message": "Target set successfully", "target_id": new_target.id}

@router.get("/targets/list")
async def get_targets_list(
    request: Request,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Get all targets"""
    
    # Verify local network access
    if not verify_local_network(request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Not on local network"
        )
    
    targets = db.query(Targets).order_by(desc(Targets.created_at)).all()
    
    return [
        {
            "id": target.id,
            "staff_name": target.staff.name,
            "target_type": target.target_type.value,
            "total_target_amount": target.total_target_amount,
            "brand_wise_targets": target.brand_wise_targets,
            "period_start": target.period_start,
            "period_end": target.period_end,
            "incentive_percentage": target.incentive_percentage,
            "created_at": target.created_at
        } for target in targets
    ]

# Brand Management
@router.post("/brands/add")
async def add_brand(
    brand_data: BrandUpdate,
    request: Request,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Add new brand"""
    
    # Verify local network access
    if not verify_local_network(request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Not on local network"
        )
    
    # Check if brand code already exists
    existing_brand = db.query(Brands).filter(Brands.brand_code == brand_data.brand_code).first()
    if existing_brand:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Brand code already exists"
        )
    
    # Create brand
    new_brand = Brands(
        brand_name=brand_data.brand_name,
        brand_code=brand_data.brand_code,
        is_active=True,
        created_at=datetime.now()
    )
    
    db.add(new_brand)
    db.commit()
    db.refresh(new_brand)
    
    return {"message": "Brand added successfully", "brand_id": new_brand.id}

@router.get("/brands/list")
async def get_brands_list(
    request: Request,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Get all brands"""
    
    # Verify local network access
    if not verify_local_network(request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Not on local network"
        )
    
    brands = db.query(Brands).filter(Brands.is_active == True).all()
    
    return [
        {
            "id": brand.id,
            "brand_name": brand.brand_name,
            "brand_code": brand.brand_code,
            "is_active": brand.is_active,
            "created_at": brand.created_at
        } for brand in brands
    ]

# Advance Management
@router.post("/advance/issue")
async def issue_advance(
    advance_data: AdvanceCreate,
    request: Request,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Issue advance to staff"""
    
    # Verify local network access
    if not verify_local_network(request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Not on local network"
        )
    
    # Verify staff exists
    staff = db.query(Staff).filter(Staff.id == advance_data.staff_id).first()
    if not staff:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staff not found"
        )
    
    # Create advance
    new_advance = Advances(
        staff_id=advance_data.staff_id,
        advance_amount=advance_data.advance_amount,
        reason=advance_data.reason,
        issue_date=advance_data.issue_date,
        total_deducted=0.0,
        remaining_amount=advance_data.advance_amount,
        deduction_plan=advance_data.deduction_plan,
        monthly_deduction_amount=advance_data.monthly_deduction_amount,
        status=AdvanceStatus.ACTIVE,
        created_at=datetime.now()
    )
    
    db.add(new_advance)
    db.commit()
    db.refresh(new_advance)
    
    return {"message": "Advance issued successfully", "advance_id": new_advance.id}

@router.get("/advance/list")
async def get_advances_list(
    request: Request,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Get all advances"""
    
    # Verify local network access
    if not verify_local_network(request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Not on local network"
        )
    
    advances = db.query(Advances).order_by(desc(Advances.created_at)).all()
    
    return [
        {
            "id": advance.id,
            "staff_name": advance.staff.name,
            "advance_amount": advance.advance_amount,
            "reason": advance.reason,
            "issue_date": advance.issue_date,
            "total_deducted": advance.total_deducted,
            "remaining_amount": advance.remaining_amount,
            "deduction_plan": advance.deduction_plan.value,
            "monthly_deduction_amount": advance.monthly_deduction_amount,
            "status": advance.status.value,
            "created_at": advance.created_at
        } for advance in advances
    ]

# Salary Management
@router.get("/salary/calculate/{month_year}")
async def calculate_salaries(
    month_year: str,
    request: Request,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Calculate salaries for all staff for a specific month"""
    
    # Verify local network access
    if not verify_local_network(request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Not on local network"
        )
    
    # Validate month_year format
    try:
        year, month = map(int, month_year.split('-'))
        if not (1 <= month <= 12):
            raise ValueError("Invalid month")
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid month_year format. Use YYYY-MM"
        )
    
    # Check if salaries already calculated for this month
    existing_salaries = db.query(Salary).filter(Salary.month_year == month_year).first()
    if existing_salaries:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Salaries already calculated for this month"
        )
    
    # Calculate salaries
    salary_records = salary_service.calculate_all_salaries(db, month_year)
    
    return {
        "message": f"Salaries calculated for {len(salary_records)} staff members",
        "month_year": month_year,
        "records_created": len(salary_records)
    }

@router.post("/salary/approve")
async def approve_salaries(
    request: Request,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db),
    month_year: Optional[str] = None
):
    """Approve calculated salaries"""
    
    # Verify local network access
    if not verify_local_network(request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Not on local network"
        )
    
    # Get pending salaries
    query = db.query(Salary).filter(Salary.payment_status == PaymentStatus.PENDING)
    if month_year:
        query = query.filter(Salary.month_year == month_year)
    
    pending_salaries = query.all()
    
    if not pending_salaries:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No pending salaries found"
        )
    
    # Approve all pending salaries
    approved_count = 0
    for salary in pending_salaries:
        salary.payment_status = PaymentStatus.APPROVED
        approved_count += 1
    
    db.commit()
    
    return {
        "message": f"Approved {approved_count} salary records",
        "approved_count": approved_count
    }

@router.get("/salary/report")
async def get_salary_report(
    request: Request,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db),
    month_year: Optional[str] = None
):
    """Get salary report"""
    
    # Verify local network access
    if not verify_local_network(request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Not on local network"
        )
    
    query = db.query(Salary)
    if month_year:
        query = query.filter(Salary.month_year == month_year)
    
    salary_records = query.order_by(desc(Salary.created_at)).all()
    
    return [
        {
            "id": salary.id,
            "staff_name": salary.staff.name,
            "employee_code": salary.staff.employee_code,
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
            "payment_date": salary.payment_date,
            "created_at": salary.created_at
        } for salary in salary_records
    ]

# Backup Management
@router.post("/backup/create")
async def create_backup(
    request: Request,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Create a new backup"""
    
    # Verify local network access
    if not verify_local_network(request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Not on local network"
        )
    
    try:
        backup_service_instance = BackupService(db)
        backup_path = backup_service_instance.create_daily_backup()
        
        return {
            "message": "Backup created successfully",
            "backup_path": backup_path,
            "created_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Backup creation failed: {str(e)}"
        )

@router.get("/backup/list")
async def list_backups(
    request: Request,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """List all available backups"""
    
    # Verify local network access
    if not verify_local_network(request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Not on local network"
        )
    
    backup_service_instance = BackupService(db)
    backups = backup_service_instance.list_backups()
    
    return {
        "backups": backups,
        "total_count": len(backups)
    }

@router.post("/backup/restore/{backup_id}")
async def restore_backup(
    backup_id: str,
    request: Request,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Restore from a backup"""
    
    # Verify local network access
    if not verify_local_network(request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Not on local network"
        )
    
    try:
        backup_service_instance = BackupService(db)
        success = backup_service_instance.restore_backup(backup_id)
        
        if success:
            return {
                "message": "Backup restored successfully",
                "backup_id": backup_id,
                "restored_at": datetime.now().isoformat()
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Backup restore failed"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Backup restore failed: {str(e)}"
        )

@router.get("/backup/status")
async def get_backup_status(
    request: Request,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Get backup system status"""
    
    # Verify local network access
    if not verify_local_network(request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Not on local network"
        )
    
    backup_service_instance = BackupService(db)
    status = backup_service_instance.get_backup_status()
    
    return status

# Missing endpoints from specification

@router.put("/sales/update/{sales_id}")
async def update_sales(
    sales_id: int,
    sales_data: SalesCreate,
    request: Request,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Update sales record"""
    
    # Verify local network access
    if not verify_local_network(request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Not on local network"
        )
    
    # Find sales record
    sales = db.query(Sales).filter(Sales.id == sales_id).first()
    if not sales:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sales record not found"
        )
    
    # Update fields
    sales.staff_id = sales_data.staff_id
    sales.brand_id = sales_data.brand_id
    sales.sale_amount = sales_data.sale_amount
    sales.sale_date = sales_data.sale_date
    sales.units_sold = sales_data.units_sold
    sales.updated_at = datetime.now()
    
    db.commit()
    
    return {"message": "Sales record updated successfully"}

@router.put("/targets/update/{target_id}")
async def update_target(
    target_id: int,
    target_data: TargetCreate,
    request: Request,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Update target"""
    
    # Verify local network access
    if not verify_local_network(request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Not on local network"
        )
    
    # Find target
    target = db.query(Targets).filter(Targets.id == target_id).first()
    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target not found"
        )
    
    # Update fields
    target.staff_id = target_data.staff_id
    target.target_type = target_data.target_type
    target.total_target_amount = target_data.total_target_amount
    target.brand_wise_targets = target_data.brand_wise_targets
    target.period_start = target_data.period_start
    target.period_end = target_data.period_end
    target.incentive_percentage = target_data.incentive_percentage
    
    db.commit()
    
    return {"message": "Target updated successfully"}

@router.put("/advance/update-deduction/{advance_id}")
async def update_advance_deduction(
    advance_id: int,
    deduction_data: AdvanceUpdate,
    request: Request,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Update advance deduction plan"""
    
    # Verify local network access
    if not verify_local_network(request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Not on local network"
        )
    
    # Find advance
    advance = db.query(Advances).filter(Advances.id == advance_id).first()
    if not advance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Advance not found"
        )
    
    # Update deduction plan
    advance.deduction_plan = deduction_data.get("deduction_plan", advance.deduction_plan)
    advance.monthly_deduction_amount = deduction_data.get("monthly_deduction_amount", advance.monthly_deduction_amount)
    
    db.commit()
    
    return {"message": "Advance deduction plan updated successfully"}

@router.put("/brands/update/{brand_id}")
async def update_brand(
    brand_id: int,
    brand_data: BrandUpdate,
    request: Request,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Update brand"""
    
    # Verify local network access
    if not verify_local_network(request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Not on local network"
        )
    
    # Find brand
    brand = db.query(Brands).filter(Brands.id == brand_id).first()
    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Brand not found"
        )
    
    # Update fields
    brand.brand_name = brand_data.brand_name
    brand.brand_code = brand_data.brand_code
    
    db.commit()
    
    return {"message": "Brand updated successfully"}

@router.delete("/brands/delete/{brand_id}")
async def delete_brand(
    brand_id: int,
    request: Request,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Delete a brand"""
    
    # Verify local network access
    if not verify_local_network(request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Not on local network"
        )
    
    # Verify admin access
    if not current_staff.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        # Get brand
        brand = db.query(Brands).filter(Brands.id == brand_id).first()
        if not brand:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Brand not found"
            )
        
        # Check if brand is used in sales
        sales_count = db.query(func.count(Sales.id)).filter(Sales.brand_id == brand_id).scalar()
        if sales_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete brand that is used in sales records"
            )
        
        # Delete brand
        db.delete(brand)
        db.commit()
        
        return {"message": "Brand deleted successfully"}
        
    except Exception as e:
        logger.error(f"Failed to delete brand {brand_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete brand"
        )

@router.delete("/advance/delete/{advance_id}")
async def delete_advance(
    advance_id: int,
    request: Request,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Delete an advance"""
    
    # Verify local network access
    if not verify_local_network(request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Not on local network"
        )
    
    # Verify admin access
    if not current_staff.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        # Get advance
        advance = db.query(Advances).filter(Advances.id == advance_id).first()
        if not advance:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Advance not found"
            )
        
        # Check if advance is already completed
        if advance.status == AdvanceStatus.COMPLETED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete completed advance"
            )
        
        # Delete advance
        db.delete(advance)
        db.commit()
        
        return {"message": "Advance deleted successfully"}
        
    except Exception as e:
        logger.error(f"Failed to delete advance {advance_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete advance"
        )

# Notification endpoints
@router.get("/notifications")
async def get_notifications(
    request: Request,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db),
    limit: int = 50,
    offset: int = 0,
    unread_only: bool = False
):
    """Get notifications for current user"""
    
    # Verify local network access
    if not verify_local_network(request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Not on local network"
        )
    
    try:
        notifications = notification_service.get_user_notifications(
            db=db,
            user_id=current_staff.id,
            limit=limit,
            offset=offset,
            unread_only=unread_only
        )
        
        return {
            "notifications": notifications,
            "total": len(notifications)
        }
        
    except Exception as e:
        logger.error(f"Failed to get notifications: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get notifications"
        )

@router.put("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    request: Request,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Mark a notification as read"""
    
    # Verify local network access
    if not verify_local_network(request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Not on local network"
        )
    
    try:
        result = notification_service.mark_notification_read(
            db=db,
            notification_id=notification_id,
            user_id=current_staff.id
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["error"]
            )
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to mark notification as read: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to mark notification as read"
        )

@router.put("/notifications/read-all")
async def mark_all_notifications_read(
    request: Request,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read for current user"""
    
    # Verify local network access
    if not verify_local_network(request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Not on local network"
        )
    
    try:
        result = notification_service.mark_all_notifications_read(
            db=db,
            user_id=current_staff.id
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["error"]
            )
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to mark all notifications as read: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to mark all notifications as read"
        )

@router.get("/notifications/statistics")
async def get_notification_statistics(
    request: Request,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Get notification statistics for current user"""
    
    # Verify local network access
    if not verify_local_network(request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Not on local network"
        )
    
    try:
        statistics = notification_service.get_notification_statistics(
            db=db,
            user_id=current_staff.id
        )
        
        return statistics
        
    except Exception as e:
        logger.error(f"Failed to get notification statistics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get notification statistics"
        )

@router.post("/notifications/send-attendance-reminder/{staff_id}")
async def send_attendance_reminder(
    staff_id: int,
    request: Request,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Send attendance reminder to a staff member"""
    
    # Verify local network access
    if not verify_local_network(request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Not on local network"
        )
    
    # Verify admin access
    if not current_staff.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        result = notification_service.send_attendance_reminder(
            db=db,
            staff_id=staff_id
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["error"]
            )
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to send attendance reminder: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send attendance reminder"
        )

@router.post("/notifications/send-system-alert")
async def send_system_alert(
    message: str,
    alert_type: str = "system",
    request: Request = None,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Send system alert to all admin users"""
    
    # Verify local network access
    if not verify_local_network(request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Not on local network"
        )
    
    # Verify admin access
    if not current_staff.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        result = notification_service.send_system_alert(
            db=db,
            message=message,
            alert_type=alert_type
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["error"]
            )
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to send system alert: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send system alert"
        )

# Template download endpoints
@router.get("/sales/template")
async def download_sales_template(
    request: Request,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Download Excel template for sales upload"""
    
    # Verify local network access
    if not verify_local_network(request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Not on local network"
        )
    
    # Verify admin access
    if not current_staff.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        # Get template file path
        template_path = excel_service.get_excel_template("sales")
        
        # Read template file
        with open(template_path, "rb") as file:
            content = file.read()
        
        # Clean up template file
        os.remove(template_path)
        
        # Return file as response
        from fastapi.responses import Response
        return Response(
            content=content,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=sales_template.xlsx"}
        )
        
    except Exception as e:
        logger.error(f"Failed to generate sales template: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate template"
        )

@router.get("/attendance/template")
async def download_attendance_template(
    request: Request,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Download Excel template for attendance upload"""
    
    # Verify local network access
    if not verify_local_network(request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Not on local network"
        )
    
    # Verify admin access
    if not current_staff.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        # Get template file path
        template_path = excel_service.get_excel_template("attendance")
        
        # Read template file
        with open(template_path, "rb") as file:
            content = file.read()
        
        # Clean up template file
        os.remove(template_path)
        
        # Return file as response
        from fastapi.responses import Response
        return Response(
            content=content,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=attendance_template.xlsx"}
        )
        
    except Exception as e:
        logger.error(f"Failed to generate attendance template: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate template"
        )

# Export endpoints
@router.get("/reports/sales/export/csv")
async def export_sales_csv(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    request: Request = None,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Export sales report as CSV"""
    
    # Verify local network access
    if not verify_local_network(request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Not on local network"
        )
    
    # Verify admin access
    if not current_staff.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        # Build query
        query = db.query(
            Sales.id,
            Sales.sale_amount,
            Sales.sale_date,
            Sales.units_sold,
            Staff.name.label('staff_name'),
            Brands.brand_name
        ).join(Staff, Sales.staff_id == Staff.id).join(Brands, Sales.brand_id == Brands.id)
        
        if start_date:
            query = query.filter(Sales.sale_date >= start_date)
        if end_date:
            query = query.filter(Sales.sale_date <= end_date)
        
        sales_data = query.all()
        
        # Convert to list of dicts
        data = []
        for sale in sales_data:
            data.append({
                'id': sale.id,
                'staff_name': sale.staff_name,
                'brand_name': sale.brand_name,
                'sale_amount': float(sale.sale_amount),
                'units_sold': sale.units_sold,
                'sale_date': sale.sale_date.strftime('%Y-%m-%d')
            })
        
        filename = f"sales_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        return file_service.generate_csv(data, filename)
        
    except Exception as e:
        logger.error(f"Failed to export sales CSV: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to export sales data"
        )

@router.get("/reports/sales/export/pdf")
async def export_sales_pdf(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    request: Request = None,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Export sales report as PDF"""
    
    # Verify local network access
    if not verify_local_network(request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Not on local network"
        )
    
    # Verify admin access
    if not current_staff.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        # Build query
        query = db.query(
            Sales.id,
            Sales.sale_amount,
            Sales.sale_date,
            Sales.units_sold,
            Staff.name.label('staff_name'),
            Brands.brand_name
        ).join(Staff, Sales.staff_id == Staff.id).join(Brands, Sales.brand_id == Brands.id)
        
        if start_date:
            query = query.filter(Sales.sale_date >= start_date)
        if end_date:
            query = query.filter(Sales.sale_date <= end_date)
        
        sales_data = query.all()
        
        # Convert to list of dicts
        data = []
        for sale in sales_data:
            data.append({
                'id': sale.id,
                'staff_name': sale.staff_name,
                'brand_name': sale.brand_name,
                'sale_amount': f"₹{sale.sale_amount:,.2f}",
                'units_sold': sale.units_sold,
                'sale_date': sale.sale_date.strftime('%Y-%m-%d')
            })
        
        columns = [
            {'key': 'id', 'header': 'ID'},
            {'key': 'staff_name', 'header': 'Staff Name'},
            {'key': 'brand_name', 'header': 'Brand'},
            {'key': 'sale_amount', 'header': 'Amount'},
            {'key': 'units_sold', 'header': 'Units'},
            {'key': 'sale_date', 'header': 'Date'}
        ]
        
        title = f"Sales Report ({start_date or 'All'} to {end_date or 'All'})"
        filename = f"sales_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        
        return file_service.generate_pdf_report(data, title, columns, filename)
        
    except Exception as e:
        logger.error(f"Failed to export sales PDF: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to export sales data"
        )

@router.get("/reports/attendance/export/csv")
async def export_attendance_csv(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    request: Request = None,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Export attendance report as CSV"""
    
    # Verify local network access
    if not verify_local_network(request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Not on local network"
        )
    
    # Verify admin access
    if not current_staff.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        # Build query
        query = db.query(
            Attendance.id,
            Attendance.date,
            Attendance.check_in_time,
            Attendance.check_out_time,
            Attendance.status,
            Staff.name.label('staff_name')
        ).join(Staff, Attendance.staff_id == Staff.id)
        
        if start_date:
            query = query.filter(Attendance.date >= start_date)
        if end_date:
            query = query.filter(Attendance.date <= end_date)
        
        attendance_data = query.all()
        
        # Convert to list of dicts
        data = []
        for attendance in attendance_data:
            data.append({
                'id': attendance.id,
                'staff_name': attendance.staff_name,
                'date': attendance.date.strftime('%Y-%m-%d'),
                'check_in_time': attendance.check_in_time.strftime('%H:%M:%S') if attendance.check_in_time else 'N/A',
                'check_out_time': attendance.check_out_time.strftime('%H:%M:%S') if attendance.check_out_time else 'N/A',
                'status': attendance.status.value
            })
        
        filename = f"attendance_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        return file_service.generate_csv(data, filename)
        
    except Exception as e:
        logger.error(f"Failed to export attendance CSV: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to export attendance data"
        )

@router.get("/reports/attendance/export/pdf")
async def export_attendance_pdf(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    request: Request = None,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Export attendance report as PDF"""
    
    # Verify local network access
    if not verify_local_network(request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Not on local network"
        )
    
    # Verify admin access
    if not current_staff.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        # Build query
        query = db.query(
            Attendance.id,
            Attendance.date,
            Attendance.check_in_time,
            Attendance.check_out_time,
            Attendance.status,
            Staff.name.label('staff_name')
        ).join(Staff, Attendance.staff_id == Staff.id)
        
        if start_date:
            query = query.filter(Attendance.date >= start_date)
        if end_date:
            query = query.filter(Attendance.date <= end_date)
        
        attendance_data = query.all()
        
        # Convert to list of dicts
        data = []
        for attendance in attendance_data:
            data.append({
                'id': attendance.id,
                'staff_name': attendance.staff_name,
                'date': attendance.date.strftime('%Y-%m-%d'),
                'check_in_time': attendance.check_in_time.strftime('%H:%M:%S') if attendance.check_in_time else 'N/A',
                'check_out_time': attendance.check_out_time.strftime('%H:%M:%S') if attendance.check_out_time else 'N/A',
                'status': attendance.status.value
            })
        
        columns = [
            {'key': 'id', 'header': 'ID'},
            {'key': 'staff_name', 'header': 'Staff Name'},
            {'key': 'date', 'header': 'Date'},
            {'key': 'check_in_time', 'header': 'Check In'},
            {'key': 'check_out_time', 'header': 'Check Out'},
            {'key': 'status', 'header': 'Status'}
        ]
        
        title = f"Attendance Report ({start_date or 'All'} to {end_date or 'All'})"
        filename = f"attendance_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        
        return file_service.generate_pdf_report(data, title, columns, filename)
        
    except Exception as e:
        logger.error(f"Failed to export attendance PDF: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to export attendance data"
        )

@router.get("/salary/slip/{staff_id}/{month_year}/pdf")
async def generate_salary_slip_pdf(
    staff_id: int,
    month_year: str,
    request: Request = None,
    current_staff: Staff = Depends(get_current_staff),
    db: Session = Depends(get_db)
):
    """Generate salary slip PDF for a staff member"""
    
    # Verify local network access
    if not verify_local_network(request):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Not on local network"
        )
    
    # Verify admin access
    if not current_staff.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    try:
        # Get staff member
        staff = db.query(Staff).filter(Staff.id == staff_id).first()
        if not staff:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Staff member not found"
            )
        
        # Get salary record for the month
        salary = db.query(Salary).filter(
            Salary.staff_id == staff_id,
            Salary.month_year == month_year
        ).first()
        
        if not salary:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Salary record not found for the specified month"
            )
        
        # Get company info
        company_info = {
            "name": "Your Company Name",
            "address": "Company Address, City, State, ZIP",
            "phone": "+1 (555) 123-4567",
            "email": "hr@company.com"
        }
        
        # Calculate values
        basic_salary = salary.basic_salary
        incentives = salary.incentive_amount
        advances_deducted = salary.advance_deduction
        net_salary = salary.net_salary
        
        filename = f"salary_slip_{staff.employee_code}_{month_year}.pdf"
        
        return file_service.generate_salary_slip_pdf(
            staff_name=staff.name,
            employee_code=staff.employee_code,
            month_year=month_year,
            basic_salary=basic_salary,
            incentives=incentives,
            advances_deducted=advances_deducted,
            net_salary=net_salary,
            company_info=company_info,
            filename=filename
        )
        
    except Exception as e:
        logger.error(f"Failed to generate salary slip PDF: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate salary slip"
        )