from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import date, datetime, timedelta
from typing import Dict, Any
from app.models.staff import Staff
from app.models.attendance import Attendance, AttendanceStatus
from app.models.sales import Sales
from app.models.targets import Targets, TargetType
from app.models.achievements import Achievements
from app.models.advances import Advances, AdvanceStatus
from app.models.salary import Salary, PaymentStatus
import calendar

class SalaryCalculator:
    """Salary calculation service implementing the specified formula"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def calculate_salary(self, staff_id: int, month_year: str) -> Dict[str, Any]:
        """
        Calculate salary using the formula:
        (basic_salary/30 * working_days) + (basic_salary/30 * sundays) + target_incentive + basic_incentive - advance_deduction
        """
        
        # Get staff details
        staff = self.db.query(Staff).filter(Staff.id == staff_id).first()
        if not staff:
            raise ValueError(f"Staff with ID {staff_id} not found")
        
        # Parse month_year (format: "2024-01")
        year, month = map(int, month_year.split('-'))
        
        # Get working days in the month
        working_days = self._get_working_days(staff_id, year, month)
        
        # Get present days
        present_days = self._get_present_days(staff_id, year, month)
        
        # Get Sunday count
        sunday_count = self._get_sunday_count(year, month)
        
        # Base calculation
        daily_rate = staff.basic_salary / 30
        salary_for_days = daily_rate * working_days
        sunday_bonus = daily_rate * sunday_count
        
        # Calculate incentives
        target_incentive = self._calculate_target_incentive(staff_id, year, month)
        basic_incentive = self._calculate_basic_incentive(staff_id, year, month)
        
        # Calculate advance deductions
        advance_deduction = self._calculate_advance_deduction(staff_id, year, month)
        
        # Gross salary
        gross_salary = salary_for_days + sunday_bonus + target_incentive + basic_incentive
        
        # Net salary
        net_salary = gross_salary - advance_deduction
        
        return {
            'basic_salary': staff.basic_salary,
            'working_days': working_days,
            'present_days': present_days,
            'sunday_count': sunday_count,
            'salary_for_days': salary_for_days,
            'sunday_bonus': sunday_bonus,
            'target_incentive': target_incentive,
            'basic_incentive': basic_incentive,
            'gross_salary': gross_salary,
            'advance_deduction': advance_deduction,
            'net_salary': net_salary
        }
    
    def _get_working_days(self, staff_id: int, year: int, month: int) -> int:
        """Get total working days in the month"""
        # Get the number of days in the month
        days_in_month = calendar.monthrange(year, month)[1]
        
        # Count working days (excluding Sundays)
        working_days = 0
        for day in range(1, days_in_month + 1):
            date_obj = date(year, month, day)
            if date_obj.weekday() != 6:  # Not Sunday
                working_days += 1
        
        return working_days
    
    def _get_present_days(self, staff_id: int, year: int, month: int) -> int:
        """Get present days for the staff in the month"""
        start_date = date(year, month, 1)
        if month == 12:
            end_date = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = date(year, month + 1, 1) - timedelta(days=1)
        
        present_count = self.db.query(func.count(Attendance.id)).filter(
            and_(
                Attendance.staff_id == staff_id,
                Attendance.date >= start_date,
                Attendance.date <= end_date,
                Attendance.status == AttendanceStatus.PRESENT
            )
        ).scalar()
        
        return present_count or 0
    
    def _get_sunday_count(self, year: int, month: int) -> int:
        """Get number of Sundays in the month"""
        sunday_count = 0
        days_in_month = calendar.monthrange(year, month)[1]
        
        for day in range(1, days_in_month + 1):
            date_obj = date(year, month, day)
            if date_obj.weekday() == 6:  # Sunday
                sunday_count += 1
        
        return sunday_count
    
    def _calculate_target_incentive(self, staff_id: int, year: int, month: int) -> float:
        """Calculate target-based incentive"""
        # Get monthly target
        target = self.db.query(Targets).filter(
            and_(
                Targets.staff_id == staff_id,
                Targets.target_type == TargetType.MONTHLY,
                Targets.period_start <= date(year, month, 1),
                Targets.period_end >= date(year, month, calendar.monthrange(year, month)[1])
            )
        ).first()
        
        if not target:
            return 0.0
        
        # Get actual sales for the month
        start_date = date(year, month, 1)
        if month == 12:
            end_date = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = date(year, month + 1, 1) - timedelta(days=1)
        
        actual_sales = self.db.query(func.sum(Sales.sale_amount)).filter(
            and_(
                Sales.staff_id == staff_id,
                Sales.sale_date >= start_date,
                Sales.sale_date <= end_date
            )
        ).scalar() or 0.0
        
        # Calculate achievement percentage
        achievement_percentage = (actual_sales / target.total_target_amount) * 100 if target.total_target_amount > 0 else 0
        
        # Calculate incentive based on achievement
        if achievement_percentage >= 100:
            incentive = target.total_target_amount * (target.incentive_percentage / 100)
        else:
            # Partial incentive based on achievement
            incentive = actual_sales * (target.incentive_percentage / 100)
        
        # Save achievement record
        achievement = Achievements(
            staff_id=staff_id,
            target_id=target.id,
            achieved_amount=actual_sales,
            achievement_percentage=achievement_percentage,
            incentive_earned=incentive,
            period=f"{year}-{month:02d}",
            created_at=datetime.now()
        )
        
        self.db.add(achievement)
        self.db.commit()
        
        return incentive
    
    def _calculate_basic_incentive(self, staff_id: int, year: int, month: int) -> float:
        """Calculate basic incentive based on staff's incentive percentage"""
        staff = self.db.query(Staff).filter(Staff.id == staff_id).first()
        if not staff or staff.incentive_percentage == 0:
            return 0.0
        
        # Get total sales for the month
        start_date = date(year, month, 1)
        if month == 12:
            end_date = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = date(year, month + 1, 1) - timedelta(days=1)
        
        total_sales = self.db.query(func.sum(Sales.sale_amount)).filter(
            and_(
                Sales.staff_id == staff_id,
                Sales.sale_date >= start_date,
                Sales.sale_date <= end_date
            )
        ).scalar() or 0.0
        
        # Calculate basic incentive
        basic_incentive = total_sales * (staff.incentive_percentage / 100)
        
        return basic_incentive
    
    def _calculate_advance_deduction(self, staff_id: int, year: int, month: int) -> float:
        """Calculate advance deduction for the month"""
        # Get active advances
        advances = self.db.query(Advances).filter(
            and_(
                Advances.staff_id == staff_id,
                Advances.status == AdvanceStatus.ACTIVE
            )
        ).all()
        
        total_deduction = 0.0
        
        for advance in advances:
            if advance.deduction_plan == "partial" and advance.monthly_deduction_amount:
                # Partial deduction
                deduction_amount = min(advance.monthly_deduction_amount, advance.remaining_amount)
                total_deduction += deduction_amount
                
                # Update advance record
                advance.total_deducted += deduction_amount
                advance.remaining_amount -= deduction_amount
                
                # Mark as cleared if fully deducted
                if advance.remaining_amount <= 0:
                    advance.status = AdvanceStatus.CLEARED
            elif advance.deduction_plan == "full":
                # Full deduction
                total_deduction += advance.remaining_amount
                advance.total_deducted += advance.remaining_amount
                advance.remaining_amount = 0
                advance.status = AdvanceStatus.CLEARED
        
        self.db.commit()
        
        return total_deduction
    
    def generate_salary_record(self, staff_id: int, month_year: str) -> Salary:
        """Generate and save salary record"""
        salary_data = self.calculate_salary(staff_id, month_year)
        
        # Create salary record
        salary_record = Salary(
            staff_id=staff_id,
            month_year=month_year,
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
            payment_status=PaymentStatus.PENDING,
            created_at=datetime.now()
        )
        
        self.db.add(salary_record)
        self.db.commit()
        self.db.refresh(salary_record)
        
        return salary_record
    
    def calculate_all_salaries(self, month_year: str) -> list:
        """Calculate salaries for all active staff"""
        active_staff = self.db.query(Staff).filter(Staff.is_active == True).all()
        salary_records = []
        
        for staff in active_staff:
            try:
                salary_record = self.generate_salary_record(staff.id, month_year)
                salary_records.append(salary_record)
            except Exception as e:
                print(f"Error calculating salary for staff {staff.id}: {str(e)}")
                continue
        
        return salary_records