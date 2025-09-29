"""
Automation service for scheduled tasks and workflows
"""
import asyncio
from typing import Dict, List, Any, Optional, Callable
from datetime import datetime, timedelta
import logging
from sqlalchemy.orm import Session
from app.models.staff import Staff
from app.models.attendance import Attendance, AttendanceStatus
from app.models.sales import Sales
from app.models.salary import Salary, PaymentStatus
from app.models.notifications import Notification
from app.services.notification_service import notification_service
from app.services.salary_service import salary_service
from app.config.settings import get_settings

logger = logging.getLogger(__name__)

class AutomationService:
    def __init__(self):
        self.settings = get_settings()
        self.scheduled_tasks = {}
        self.running = False
    
    async def start_automation(self):
        """Start automation service"""
        self.running = True
        logger.info("Automation service started")
        
        # Start background tasks
        asyncio.create_task(self.daily_attendance_reminder())
        asyncio.create_task(self.weekly_performance_report())
        asyncio.create_task(self.monthly_salary_calculation())
        asyncio.create_task(self.quarterly_target_review())
        asyncio.create_task(self.annual_backup())
    
    async def stop_automation(self):
        """Stop automation service"""
        self.running = False
        logger.info("Automation service stopped")
    
    async def daily_attendance_reminder(self):
        """Send daily attendance reminders"""
        while self.running:
            try:
                current_time = datetime.now()
                
                # Check if it's time for attendance reminder (9:00 AM)
                if current_time.hour == 9 and current_time.minute == 0:
                    await self.send_attendance_reminders()
                
                # Wait for next minute
                await asyncio.sleep(60)
            except Exception as e:
                logger.error(f"Daily attendance reminder error: {e}")
                await asyncio.sleep(60)
    
    async def send_attendance_reminders(self):
        """Send attendance reminders to staff who haven't checked in"""
        try:
            from app.models.base import get_db
            db = next(get_db())
            
            today = datetime.now().date()
            current_time = datetime.now().time()
            
            # Get staff who haven't checked in today
            staff_without_attendance = db.query(Staff).filter(
                Staff.is_active == True,
                Staff.id.notin_(
                    db.query(Attendance.staff_id).filter(
                        Attendance.date == today
                    )
                )
            ).all()
            
            for staff in staff_without_attendance:
                # Send reminder notification
                notification_service.create_notification(
                    db=db,
                    user_id=staff.id,
                    title="Attendance Reminder",
                    message="Please check in for today's attendance",
                    notification_type="reminder",
                    priority="normal"
                )
                
                # Send email if enabled
                if self.settings.email_notifications_enabled and staff.email:
                    notification_service.send_attendance_reminder(db, staff.id)
            
            logger.info(f"Sent attendance reminders to {len(staff_without_attendance)} staff members")
            
        except Exception as e:
            logger.error(f"Failed to send attendance reminders: {e}")
    
    async def weekly_performance_report(self):
        """Generate weekly performance reports"""
        while self.running:
            try:
                current_time = datetime.now()
                
                # Check if it's Monday 8:00 AM
                if current_time.weekday() == 0 and current_time.hour == 8 and current_time.minute == 0:
                    await self.generate_weekly_report()
                
                # Wait for next hour
                await asyncio.sleep(3600)
            except Exception as e:
                logger.error(f"Weekly performance report error: {e}")
                await asyncio.sleep(3600)
    
    async def generate_weekly_report(self):
        """Generate weekly performance report"""
        try:
            from app.models.base import get_db
            db = next(get_db())
            
            # Get last week's data
            end_date = datetime.now().date()
            start_date = end_date - timedelta(days=7)
            
            # Get sales data
            sales_data = db.query(Sales).filter(
                Sales.sale_date >= start_date,
                Sales.sale_date <= end_date
            ).all()
            
            # Get attendance data
            attendance_data = db.query(Attendance).filter(
                Attendance.date >= start_date,
                Attendance.date <= end_date
            ).all()
            
            # Generate report
            report = {
                'period': f"{start_date} to {end_date}",
                'total_sales': sum(sale.sale_amount for sale in sales_data),
                'total_attendance': len(attendance_data),
                'attendance_rate': len(attendance_data) / (len(db.query(Staff).filter(Staff.is_active == True).all()) * 7) * 100
            }
            
            # Send to admins
            admin_users = db.query(Staff).filter(Staff.is_admin == True).all()
            for admin in admin_users:
                notification_service.create_notification(
                    db=db,
                    user_id=admin.id,
                    title="Weekly Performance Report",
                    message=f"Weekly report generated: {report['total_sales']} sales, {report['attendance_rate']:.1f}% attendance rate",
                    notification_type="report",
                    priority="normal",
                    data=report
                )
            
            logger.info("Weekly performance report generated")
            
        except Exception as e:
            logger.error(f"Failed to generate weekly report: {e}")
    
    async def monthly_salary_calculation(self):
        """Automated monthly salary calculation"""
        while self.running:
            try:
                current_time = datetime.now()
                
                # Check if it's the 1st of the month at 6:00 AM
                if current_time.day == 1 and current_time.hour == 6 and current_time.minute == 0:
                    await self.calculate_monthly_salaries()
                
                # Wait for next hour
                await asyncio.sleep(3600)
            except Exception as e:
                logger.error(f"Monthly salary calculation error: {e}")
                await asyncio.sleep(3600)
    
    async def calculate_monthly_salaries(self):
        """Calculate salaries for all staff"""
        try:
            from app.models.base import get_db
            db = next(get_db())
            
            # Get previous month
            today = datetime.now().date()
            if today.month == 1:
                prev_month = 12
                prev_year = today.year - 1
            else:
                prev_month = today.month - 1
                prev_year = today.year
            
            month_year = f"{prev_year}-{prev_month:02d}"
            
            # Get all active staff
            active_staff = db.query(Staff).filter(Staff.is_active == True).all()
            
            for staff in active_staff:
                try:
                    # Calculate salary
                    salary_data = salary_service.calculate_salary(db, staff.id, month_year)
                    
                    if salary_data['success']:
                        # Send notification to staff
                        notification_service.create_notification(
                            db=db,
                            user_id=staff.id,
                            title="Salary Calculated",
                            message=f"Your salary for {month_year} has been calculated: {salary_data['net_salary']}",
                            notification_type="salary",
                            priority="high",
                            data=salary_data
                        )
                        
                        # Send email notification
                        if self.settings.email_notifications_enabled and staff.email:
                            notification_service.send_salary_notification(db, staff.id, salary_data)
                    
                except Exception as e:
                    logger.error(f"Failed to calculate salary for staff {staff.id}: {e}")
            
            logger.info(f"Monthly salary calculation completed for {month_year}")
            
        except Exception as e:
            logger.error(f"Failed to calculate monthly salaries: {e}")
    
    async def quarterly_target_review(self):
        """Quarterly target review and adjustment"""
        while self.running:
            try:
                current_time = datetime.now()
                
                # Check if it's the first day of a quarter at 7:00 AM
                if (current_time.month in [1, 4, 7, 10] and 
                    current_time.day == 1 and 
                    current_time.hour == 7 and 
                    current_time.minute == 0):
                    await self.review_quarterly_targets()
                
                # Wait for next day
                await asyncio.sleep(86400)
            except Exception as e:
                logger.error(f"Quarterly target review error: {e}")
                await asyncio.sleep(86400)
    
    async def review_quarterly_targets(self):
        """Review and adjust quarterly targets"""
        try:
            from app.models.base import get_db
            db = next(get_db())
            
            # Get performance data for the quarter
            quarter_start = datetime.now().date().replace(day=1)
            if quarter_start.month in [1, 4, 7, 10]:
                quarter_start = quarter_start.replace(month=quarter_start.month - 3 if quarter_start.month > 3 else quarter_start.month + 9)
            
            # Analyze performance and suggest target adjustments
            staff_performance = db.query(Staff).filter(Staff.is_active == True).all()
            
            for staff in staff_performance:
                # Get sales performance
                sales_data = db.query(Sales).filter(
                    Sales.staff_id == staff.id,
                    Sales.sale_date >= quarter_start
                ).all()
                
                total_sales = sum(sale.sale_amount for sale in sales_data)
                
                # Create performance review notification
                notification_service.create_notification(
                    db=db,
                    user_id=staff.id,
                    title="Quarterly Performance Review",
                    message=f"Your quarterly performance: {total_sales} in sales. Review your targets for the next quarter.",
                    notification_type="review",
                    priority="normal",
                    data={'total_sales': total_sales, 'quarter': quarter_start}
                )
            
            logger.info("Quarterly target review completed")
            
        except Exception as e:
            logger.error(f"Failed to review quarterly targets: {e}")
    
    async def annual_backup(self):
        """Annual system backup"""
        while self.running:
            try:
                current_time = datetime.now()
                
                # Check if it's January 1st at 2:00 AM
                if (current_time.month == 1 and 
                    current_time.day == 1 and 
                    current_time.hour == 2 and 
                    current_time.minute == 0):
                    await self.perform_annual_backup()
                
                # Wait for next day
                await asyncio.sleep(86400)
            except Exception as e:
                logger.error(f"Annual backup error: {e}")
                await asyncio.sleep(86400)
    
    async def perform_annual_backup(self):
        """Perform annual system backup"""
        try:
            from app.services.backup_service import BackupService
            backup_service = BackupService()
            
            # Create full system backup
            backup_result = backup_service.create_backup("annual_backup")
            
            if backup_result['success']:
                # Notify admins
                from app.models.base import get_db
                db = next(get_db())
                
                admin_users = db.query(Staff).filter(Staff.is_admin == True).all()
                for admin in admin_users:
                    notification_service.create_notification(
                        db=db,
                        user_id=admin.id,
                        title="Annual Backup Completed",
                        message=f"Annual system backup completed successfully: {backup_result['filename']}",
                        notification_type="backup",
                        priority="normal",
                        data=backup_result
                    )
                
                logger.info("Annual backup completed successfully")
            else:
                logger.error(f"Annual backup failed: {backup_result['error']}")
            
        except Exception as e:
            logger.error(f"Failed to perform annual backup: {e}")
    
    def schedule_custom_task(self, task_name: str, task_func: Callable, 
                            schedule_time: datetime, **kwargs):
        """Schedule a custom task"""
        self.scheduled_tasks[task_name] = {
            'function': task_func,
            'schedule_time': schedule_time,
            'kwargs': kwargs,
            'executed': False
        }
        logger.info(f"Custom task '{task_name}' scheduled for {schedule_time}")
    
    async def execute_scheduled_tasks(self):
        """Execute scheduled custom tasks"""
        while self.running:
            try:
                current_time = datetime.now()
                
                for task_name, task_info in self.scheduled_tasks.items():
                    if (not task_info['executed'] and 
                        current_time >= task_info['schedule_time']):
                        
                        try:
                            await task_info['function'](**task_info['kwargs'])
                            task_info['executed'] = True
                            logger.info(f"Custom task '{task_name}' executed successfully")
                        except Exception as e:
                            logger.error(f"Custom task '{task_name}' failed: {e}")
                
                # Wait for next minute
                await asyncio.sleep(60)
            except Exception as e:
                logger.error(f"Scheduled task execution error: {e}")
                await asyncio.sleep(60)
    
    def get_automation_status(self) -> Dict[str, Any]:
        """Get automation service status"""
        return {
            'running': self.running,
            'scheduled_tasks': len(self.scheduled_tasks),
            'executed_tasks': len([t for t in self.scheduled_tasks.values() if t['executed']]),
            'next_daily_reminder': self._get_next_daily_reminder_time(),
            'next_weekly_report': self._get_next_weekly_report_time(),
            'next_monthly_salary': self._get_next_monthly_salary_time()
        }
    
    def _get_next_daily_reminder_time(self) -> str:
        """Get next daily reminder time"""
        now = datetime.now()
        next_reminder = now.replace(hour=9, minute=0, second=0, microsecond=0)
        if next_reminder <= now:
            next_reminder += timedelta(days=1)
        return next_reminder.isoformat()
    
    def _get_next_weekly_report_time(self) -> str:
        """Get next weekly report time"""
        now = datetime.now()
        days_ahead = 0 - now.weekday()  # Monday is 0
        if days_ahead <= 0:  # Target day already happened this week
            days_ahead += 7
        next_monday = now + timedelta(days=days_ahead)
        next_report = next_monday.replace(hour=8, minute=0, second=0, microsecond=0)
        return next_report.isoformat()
    
    def _get_next_monthly_salary_time(self) -> str:
        """Get next monthly salary calculation time"""
        now = datetime.now()
        if now.day == 1:
            next_month = now.replace(month=now.month + 1 if now.month < 12 else 1,
                                   year=now.year + 1 if now.month == 12 else now.year,
                                   day=1, hour=6, minute=0, second=0, microsecond=0)
        else:
            next_month = now.replace(day=1, hour=6, minute=0, second=0, microsecond=0)
            if now.month == 12:
                next_month = next_month.replace(year=now.year + 1, month=1)
            else:
                next_month = next_month.replace(month=now.month + 1)
        return next_month.isoformat()

# Global automation service instance
automation_service = AutomationService()