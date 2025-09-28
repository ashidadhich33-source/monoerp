import schedule
import time
import threading
from datetime import datetime
from app.services.backup_service import BackupService
from app.models.base import SessionLocal
import logging

logger = logging.getLogger(__name__)

# Global scheduler instance
scheduler_service = None

def start_background_tasks():
    """Start background tasks"""
    global scheduler_service
    if scheduler_service is None:
        scheduler_service = SchedulerService()
    scheduler_service.start_scheduler()

def stop_background_tasks():
    """Stop background tasks"""
    global scheduler_service
    if scheduler_service:
        scheduler_service.stop_scheduler()

class SchedulerService:
    """Service for managing scheduled tasks"""
    
    def __init__(self):
        self.running = False
        self.thread = None
    
    def start_scheduler(self):
        """Start the scheduler in a separate thread"""
        if not self.running:
            self.running = True
            self.thread = threading.Thread(target=self._run_scheduler, daemon=True)
            self.thread.start()
            logger.info("Scheduler started")
    
    def stop_scheduler(self):
        """Stop the scheduler"""
        self.running = False
        if self.thread:
            self.thread.join()
        logger.info("Scheduler stopped")
    
    def _run_scheduler(self):
        """Run the scheduler loop"""
        while self.running:
            schedule.run_pending()
            time.sleep(60)  # Check every minute
    
    def setup_daily_backup(self):
        """Setup daily backup at 23:00"""
        schedule.every().day.at("23:00").do(self._daily_backup)
        logger.info("Daily backup scheduled for 23:00")
    
    def _daily_backup(self):
        """Perform daily backup"""
        try:
            db = SessionLocal()
            backup_service = BackupService(db)
            backup_path = backup_service.create_daily_backup()
            logger.info(f"Daily backup completed: {backup_path}")
        except Exception as e:
            logger.error(f"Daily backup failed: {str(e)}")
        finally:
            db.close()
    
    def setup_cleanup_old_backups(self):
        """Setup cleanup of old backups (keep 30 days)"""
        schedule.every().day.at("02:00").do(self._cleanup_old_backups)
        logger.info("Backup cleanup scheduled for 02:00")
    
    def _cleanup_old_backups(self):
        """Clean up old backup files"""
        try:
            db = SessionLocal()
            backup_service = BackupService(db)
            backup_service.cleanup_old_backups(days_to_keep=30)
            logger.info("Old backup cleanup completed")
        except Exception as e:
            logger.error(f"Backup cleanup failed: {str(e)}")
        finally:
            db.close()

# Global scheduler instance
scheduler = SchedulerService()

def start_background_tasks():
    """Start all background tasks"""
    scheduler.setup_daily_backup()
    scheduler.setup_cleanup_old_backups()
    scheduler.start_scheduler()
    logger.info("All background tasks started")

def stop_background_tasks():
    """Stop all background tasks"""
    scheduler.stop_scheduler()
    logger.info("All background tasks stopped")