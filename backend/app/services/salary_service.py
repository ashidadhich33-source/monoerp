"""
Salary management service for handling staff salaries and calculations
"""
from typing import List, Dict, Any, Optional
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, func
from app.models.salary import Salary
from app.models.staff import Staff
from app.models.attendance import Attendance
from app.models.sales import Sales
from app.models.targets import Targets
from app.models.advances import Advances
import logging

logger = logging.getLogger(__name__)

class SalaryService:
    def __init__(self):
        pass
    
    def calculate_salary(self, db: Session, staff_id: int, month_year: str) -> Dict[str, Any]:
        """Calculate salary for a staff member for a specific month"""
        try:
            # Parse month and year
            year, month = map(int, month_year.split('-'))
            start_date = date(year, month, 1)
            if month == 12:
                end_date = date(year + 1, 1, 1) - timedelta(days=1)
            else:
                end_date = date(year, month + 1, 1) - timedelta(days=1)
            
            # Get staff information
            staff = db.query(Staff).filter(Staff.id == staff_id).first()
            if not staff:
                return {"success": False, "error": "Staff member not found"}
            
            # Get attendance records
            attendance_records = db.query(Attendance).filter(
                and_(
                    Attendance.staff_id == staff_id,
                    Attendance.date >= start_date,
                    Attendance.date <= end_date
                )
            ).all()
            
            # Calculate working days
            working_days = self._calculate_working_days(start_date, end_date)
            present_days = len([record for record in attendance_records if record.status == 'present'])
            sunday_count = self._count_sundays(start_date, end_date)
            
            # Calculate salary for days
            salary_for_days = (staff.basic_salary / working_days) * present_days
            
            # Get sales for the month
            sales_records = db.query(Sales).filter(
                and_(
                    Sales.staff_id == staff_id,
                    Sales.sale_date >= start_date,
                    Sales.sale_date <= end_date
                )
            ).all()
            
            total_sales = sum(sale.sale_amount for sale in sales_records)
            
            # Calculate target incentive
            target = db.query(Targets).filter(
                and_(
                    Targets.staff_id == staff_id,
                    Targets.start_date <= start_date,
                    Targets.end_date >= end_date,
                    Targets.status == 'active'
                )
            ).first()
            
            target_incentive = 0
            if target and total_sales >= target.target_amount:
                target_incentive = (total_sales - target.target_amount) * 0.1  # 10% of excess
            
            # Calculate basic incentive
            basic_incentive = total_sales * (staff.incentive_percentage / 100)
            
            # Calculate advance deduction
            advance_deduction = self._calculate_advance_deduction(db, staff_id, month_year)
            
            # Calculate gross salary
            gross_salary = salary_for_days + target_incentive + basic_incentive
            
            # Calculate net salary
            net_salary = gross_salary - advance_deduction
            
            return {
                "success": True,
                "staff_id": staff_id,
                "month_year": month_year,
                "basic_salary": staff.basic_salary,
                "working_days": working_days,
                "present_days": present_days,
                "sunday_count": sunday_count,
                "salary_for_days": salary_for_days,
                "target_incentive": target_incentive,
                "basic_incentive": basic_incentive,
                "gross_salary": gross_salary,
                "advance_deduction": advance_deduction,
                "net_salary": net_salary,
                "total_sales": total_sales
            }
            
        except Exception as e:
            logger.error(f"Failed to calculate salary: {e}")
            return {"success": False, "error": str(e)}
    
    def create_salary_record(self, db: Session, salary_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a salary record"""
        try:
            # Check if salary record already exists
            existing = db.query(Salary).filter(
                and_(
                    Salary.staff_id == salary_data['staff_id'],
                    Salary.month_year == salary_data['month_year']
                )
            ).first()
            
            if existing:
                return {"success": False, "error": "Salary record already exists for this month"}
            
            # Create salary record
            salary = Salary(
                staff_id=salary_data['staff_id'],
                month_year=salary_data['month_year'],
                basic_salary=salary_data['basic_salary'],
                working_days=salary_data['working_days'],
                present_days=salary_data['present_days'],
                sunday_count=salary_data['sunday_count'],
                salary_for_days=salary_data['salary_for_days'],
                target_incentive=salary_data['target_incentive'],
                basic_incentive=salary_data['basic_incentive'],
                gross_salary=salary_data['gross_salary'],
                advance_deduction=salary_data['advance_deduction'],
                net_salary=salary_data['net_salary'],
                payment_status='pending',
                created_at=datetime.now()
            )
            
            db.add(salary)
            db.commit()
            
            return {
                "success": True,
                "salary_id": salary.id,
                "message": "Salary record created successfully"
            }
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to create salary record: {e}")
            return {"success": False, "error": str(e)}
    
    def get_salary_details(self, db: Session, staff_id: int, month_year: str) -> Optional[Dict[str, Any]]:
        """Get salary details for a staff member"""
        try:
            salary = db.query(Salary).filter(
                and_(
                    Salary.staff_id == staff_id,
                    Salary.month_year == month_year
                )
            ).first()
            
            if not salary:
                return None
            
            return {
                "id": salary.id,
                "staff_id": salary.staff_id,
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
                "payment_status": salary.payment_status,
                "payment_date": salary.payment_date.isoformat() if salary.payment_date else None,
                "created_at": salary.created_at.isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to get salary details: {e}")
            return None
    
    def get_salary_list(self, db: Session, month_year: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get salary list with optional month filter"""
        try:
            query = db.query(Salary)
            if month_year:
                query = query.filter(Salary.month_year == month_year)
            
            salaries = query.order_by(desc(Salary.created_at)).all()
            
            result = []
            for salary in salaries:
                staff = db.query(Staff).filter(Staff.id == salary.staff_id).first()
                result.append({
                    "id": salary.id,
                    "staff_name": staff.name if staff else "Unknown",
                    "month_year": salary.month_year,
                    "basic_salary": salary.basic_salary,
                    "gross_salary": salary.gross_salary,
                    "net_salary": salary.net_salary,
                    "payment_status": salary.payment_status,
                    "payment_date": salary.payment_date.isoformat() if salary.payment_date else None,
                    "created_at": salary.created_at.isoformat()
                })
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to get salary list: {e}")
            return []
    
    def approve_salary(self, db: Session, salary_id: int) -> Dict[str, Any]:
        """Approve salary payment"""
        try:
            salary = db.query(Salary).filter(Salary.id == salary_id).first()
            if not salary:
                return {"success": False, "error": "Salary record not found"}
            
            if salary.payment_status != 'pending':
                return {"success": False, "error": "Salary is not in pending status"}
            
            salary.payment_status = 'approved'
            salary.approved_at = datetime.now()
            
            db.commit()
            
            return {"success": True, "message": "Salary approved successfully"}
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to approve salary: {e}")
            return {"success": False, "error": str(e)}
    
    def pay_salary(self, db: Session, salary_id: int) -> Dict[str, Any]:
        """Mark salary as paid"""
        try:
            salary = db.query(Salary).filter(Salary.id == salary_id).first()
            if not salary:
                return {"success": False, "error": "Salary record not found"}
            
            if salary.payment_status not in ['approved', 'pending']:
                return {"success": False, "error": "Salary is not in approved or pending status"}
            
            salary.payment_status = 'paid'
            salary.payment_date = datetime.now()
            
            db.commit()
            
            return {"success": True, "message": "Salary marked as paid"}
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to pay salary: {e}")
            return {"success": False, "error": str(e)}
    
    def bulk_approve_salary(self, db: Session, month_year: str) -> Dict[str, Any]:
        """Bulk approve all pending salaries for a month"""
        try:
            pending_salaries = db.query(Salary).filter(
                and_(
                    Salary.month_year == month_year,
                    Salary.payment_status == 'pending'
                )
            ).all()
            
            approved_count = 0
            for salary in pending_salaries:
                salary.payment_status = 'approved'
                salary.approved_at = datetime.now()
                approved_count += 1
            
            db.commit()
            
            return {
                "success": True,
                "approved_count": approved_count,
                "message": f"Approved {approved_count} salary records"
            }
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to bulk approve salaries: {e}")
            return {"success": False, "error": str(e)}
    
    def _calculate_working_days(self, start_date: date, end_date: date) -> int:
        """Calculate working days between two dates (excluding Sundays)"""
        working_days = 0
        current_date = start_date
        
        while current_date <= end_date:
            if current_date.weekday() != 6:  # Not Sunday
                working_days += 1
            current_date += timedelta(days=1)
        
        return working_days
    
    def _count_sundays(self, start_date: date, end_date: date) -> int:
        """Count Sundays between two dates"""
        sundays = 0
        current_date = start_date
        
        while current_date <= end_date:
            if current_date.weekday() == 6:  # Sunday
                sundays += 1
            current_date += timedelta(days=1)
        
        return sundays
    
    def _calculate_advance_deduction(self, db: Session, staff_id: int, month_year: str) -> float:
        """Calculate advance deduction for a staff member"""
        try:
            # Get approved advances
            advances = db.query(Advances).filter(
                and_(
                    Advances.staff_id == staff_id,
                    Advances.status == 'approved'
                )
            ).all()
            
            total_deduction = 0
            for advance in advances:
                # Calculate monthly deduction amount
                monthly_deduction = advance.advance_amount / advance.deduction_periods
                total_deduction += monthly_deduction
            
            return total_deduction
            
        except Exception as e:
            logger.error(f"Failed to calculate advance deduction: {e}")
            return 0.0
    
    def get_salary_statistics(self, db: Session, month_year: Optional[str] = None) -> Dict[str, Any]:
        """Get salary statistics"""
        try:
            query = db.query(Salary)
            if month_year:
                query = query.filter(Salary.month_year == month_year)
            
            salaries = query.all()
            
            total_salaries = len(salaries)
            total_amount = sum(salary.net_salary for salary in salaries)
            paid_salaries = len([s for s in salaries if s.payment_status == 'paid'])
            pending_salaries = len([s for s in salaries if s.payment_status == 'pending'])
            approved_salaries = len([s for s in salaries if s.payment_status == 'approved'])
            
            return {
                "total_salaries": total_salaries,
                "total_amount": total_amount,
                "paid_salaries": paid_salaries,
                "pending_salaries": pending_salaries,
                "approved_salaries": approved_salaries
            }
            
        except Exception as e:
            logger.error(f"Failed to get salary statistics: {e}")
            return {}
    
    def calculate_all_salaries(self, db: Session, month_year: str) -> List[Salary]:
        """Calculate salaries for all active staff for a specific month"""
        try:
            year, month = map(int, month_year.split('-'))
            
            # Get all active staff
            staff_members = db.query(Staff).filter(Staff.is_active == True).all()
            salary_records = []
            
            for staff in staff_members:
                salary = self.calculate_staff_salary(db, staff.id, month, year)
                if salary:
                    salary_records.append(salary)
            
            return salary_records
            
        except Exception as e:
            logger.error(f"Failed to calculate all salaries for {month_year}: {e}")
            return []

# Global salary service instance
salary_service = SalaryService()