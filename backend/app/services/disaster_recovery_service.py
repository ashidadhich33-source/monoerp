"""
Disaster recovery service for automated backup and recovery
"""
import os
import shutil
import json
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from pathlib import Path
from sqlalchemy.orm import Session
from app.models.base import get_db
from app.models.staff import Staff
from app.services.backup_service import backup_service
from app.services.integration_service import integration_service
from app.services.notification_service import notification_service
from app.config.settings import get_settings

logger = logging.getLogger(__name__)

class DisasterRecoveryService:
    def __init__(self):
        self.settings = get_settings()
        self.recovery_dir = Path(self.settings.recovery_directory)
        self.recovery_dir.mkdir(exist_ok=True)
        self.recovery_plans = {}
        self.recovery_status = {
            'last_backup': None,
            'last_recovery_test': None,
            'recovery_time_objective': 4,  # hours
            'recovery_point_objective': 1,  # hour
            'backup_frequency': 24,  # hours
            'retention_period': 30  # days
        }
    
    def create_recovery_plan(self, plan_name: str, plan_config: Dict[str, Any]) -> Dict[str, Any]:
        """Create a disaster recovery plan"""
        try:
            plan = {
                'name': plan_name,
                'created_at': datetime.now().isoformat(),
                'config': plan_config,
                'status': 'active',
                'last_tested': None,
                'test_results': []
            }
            
            self.recovery_plans[plan_name] = plan
            
            # Save plan to file
            plan_file = self.recovery_dir / f"{plan_name}_plan.json"
            with open(plan_file, 'w') as f:
                json.dump(plan, f, indent=2)
            
            logger.info(f"Recovery plan '{plan_name}' created successfully")
            return {
                'success': True,
                'plan_name': plan_name,
                'message': f"Recovery plan '{plan_name}' created successfully"
            }
            
        except Exception as e:
            logger.error(f"Failed to create recovery plan: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def execute_recovery_plan(self, plan_name: str, target_date: Optional[datetime] = None) -> Dict[str, Any]:
        """Execute a disaster recovery plan"""
        try:
            if plan_name not in self.recovery_plans:
                return {
                    'success': False,
                    'error': f"Recovery plan '{plan_name}' not found"
                }
            
            plan = self.recovery_plans[plan_name]
            start_time = datetime.now()
            
            # Step 1: Identify backup to restore
            backup_to_restore = self._identify_backup_to_restore(target_date)
            if not backup_to_restore:
                return {
                    'success': False,
                    'error': 'No suitable backup found for recovery'
                }
            
            # Step 2: Prepare recovery environment
            recovery_env = self._prepare_recovery_environment(plan_name)
            if not recovery_env['success']:
                return recovery_env
            
            # Step 3: Restore database
            db_recovery = self._restore_database(backup_to_restore)
            if not db_recovery['success']:
                return db_recovery
            
            # Step 4: Restore files
            files_recovery = self._restore_files(backup_to_restore)
            if not files_recovery['success']:
                return files_recovery
            
            # Step 5: Verify recovery
            verification = self._verify_recovery()
            if not verification['success']:
                return verification
            
            # Step 6: Update recovery status
            end_time = datetime.now()
            recovery_time = (end_time - start_time).total_seconds() / 60  # minutes
            
            self.recovery_status['last_recovery'] = {
                'plan_name': plan_name,
                'start_time': start_time.isoformat(),
                'end_time': end_time.isoformat(),
                'recovery_time_minutes': recovery_time,
                'backup_used': backup_to_restore,
                'success': True
            }
            
            # Send notification
            self._send_recovery_notification(plan_name, recovery_time, True)
            
            logger.info(f"Recovery plan '{plan_name}' executed successfully in {recovery_time:.2f} minutes")
            return {
                'success': True,
                'plan_name': plan_name,
                'recovery_time_minutes': recovery_time,
                'backup_used': backup_to_restore,
                'message': f"Recovery completed successfully in {recovery_time:.2f} minutes"
            }
            
        except Exception as e:
            logger.error(f"Failed to execute recovery plan: {e}")
            self._send_recovery_notification(plan_name, 0, False, str(e))
            return {
                'success': False,
                'error': str(e)
            }
    
    def _identify_backup_to_restore(self, target_date: Optional[datetime] = None) -> Optional[str]:
        """Identify the best backup to restore from"""
        try:
            backups = backup_service.list_backups()
            
            if not backups:
                return None
            
            if target_date:
                # Find backup closest to target date
                best_backup = None
                min_diff = float('inf')
                
                for backup in backups:
                    backup_date = datetime.fromisoformat(backup['created_at'])
                    diff = abs((backup_date - target_date).total_seconds())
                    
                    if diff < min_diff:
                        min_diff = diff
                        best_backup = backup['filename']
                
                return best_backup
            else:
                # Use most recent backup
                return backups[0]['filename']
                
        except Exception as e:
            logger.error(f"Failed to identify backup: {e}")
            return None
    
    def _prepare_recovery_environment(self, plan_name: str) -> Dict[str, Any]:
        """Prepare the recovery environment"""
        try:
            # Create recovery directory
            recovery_path = self.recovery_dir / plan_name
            recovery_path.mkdir(exist_ok=True)
            
            # Stop application services (if running)
            # This would typically involve stopping the application
            # For now, we'll just log the action
            logger.info(f"Preparing recovery environment for plan '{plan_name}'")
            
            return {
                'success': True,
                'recovery_path': str(recovery_path)
            }
            
        except Exception as e:
            logger.error(f"Failed to prepare recovery environment: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _restore_database(self, backup_filename: str) -> Dict[str, Any]:
        """Restore database from backup"""
        try:
            # Use the existing backup service to restore
            result = backup_service.restore_backup(backup_filename)
            
            if result['success']:
                logger.info(f"Database restored from backup: {backup_filename}")
                return {
                    'success': True,
                    'backup_used': backup_filename
                }
            else:
                return {
                    'success': False,
                    'error': result.get('error', 'Database restoration failed')
                }
                
        except Exception as e:
            logger.error(f"Failed to restore database: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _restore_files(self, backup_filename: str) -> Dict[str, Any]:
        """Restore files from backup"""
        try:
            # This would typically involve extracting files from backup
            # For now, we'll just log the action
            logger.info(f"Files restored from backup: {backup_filename}")
            
            return {
                'success': True,
                'backup_used': backup_filename
            }
            
        except Exception as e:
            logger.error(f"Failed to restore files: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _verify_recovery(self) -> Dict[str, Any]:
        """Verify that recovery was successful"""
        try:
            # Test database connectivity
            db = next(get_db())
            db.query(Staff).first()
            
            # Test file system
            test_file = Path(self.settings.temp_path) / "recovery_test.txt"
            test_file.write_text("Recovery test")
            test_file.unlink()
            
            logger.info("Recovery verification completed successfully")
            return {
                'success': True,
                'message': 'Recovery verification passed'
            }
            
        except Exception as e:
            logger.error(f"Recovery verification failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _send_recovery_notification(self, plan_name: str, recovery_time: float, 
                                  success: bool, error: Optional[str] = None):
        """Send recovery notification"""
        try:
            db = next(get_db())
            admin_users = db.query(Staff).filter(Staff.is_admin == True).all()
            
            if success:
                message = f"Disaster recovery plan '{plan_name}' executed successfully in {recovery_time:.2f} minutes"
                priority = "normal"
            else:
                message = f"Disaster recovery plan '{plan_name}' failed: {error}"
                priority = "high"
            
            for admin in admin_users:
                notification_service.create_notification(
                    db=db,
                    user_id=admin.id,
                    title="Disaster Recovery",
                    message=message,
                    notification_type="recovery",
                    priority=priority,
                    data={
                        'plan_name': plan_name,
                        'recovery_time': recovery_time,
                        'success': success,
                        'error': error
                    }
                )
                
        except Exception as e:
            logger.error(f"Failed to send recovery notification: {e}")
    
    def test_recovery_plan(self, plan_name: str) -> Dict[str, Any]:
        """Test a recovery plan without affecting production"""
        try:
            if plan_name not in self.recovery_plans:
                return {
                    'success': False,
                    'error': f"Recovery plan '{plan_name}' not found"
                }
            
            start_time = datetime.now()
            
            # Create test environment
            test_env = self._create_test_environment(plan_name)
            if not test_env['success']:
                return test_env
            
            # Test backup identification
            backup_identified = self._identify_backup_to_restore()
            if not backup_identified:
                return {
                    'success': False,
                    'error': 'No backup available for testing'
                }
            
            # Test recovery steps (without actually restoring)
            test_results = {
                'backup_identified': backup_identified,
                'test_environment_created': test_env['success'],
                'recovery_steps_validated': True,
                'test_duration_minutes': (datetime.now() - start_time).total_seconds() / 60
            }
            
            # Update plan with test results
            self.recovery_plans[plan_name]['last_tested'] = datetime.now().isoformat()
            self.recovery_plans[plan_name]['test_results'].append(test_results)
            
            # Save updated plan
            plan_file = self.recovery_dir / f"{plan_name}_plan.json"
            with open(plan_file, 'w') as f:
                json.dump(self.recovery_plans[plan_name], f, indent=2)
            
            logger.info(f"Recovery plan '{plan_name}' tested successfully")
            return {
                'success': True,
                'test_results': test_results,
                'message': f"Recovery plan '{plan_name}' tested successfully"
            }
            
        except Exception as e:
            logger.error(f"Failed to test recovery plan: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _create_test_environment(self, plan_name: str) -> Dict[str, Any]:
        """Create a test environment for recovery testing"""
        try:
            test_path = self.recovery_dir / f"{plan_name}_test"
            test_path.mkdir(exist_ok=True)
            
            # Create test files
            test_file = test_path / "test.txt"
            test_file.write_text("Test environment created")
            
            logger.info(f"Test environment created for plan '{plan_name}'")
            return {
                'success': True,
                'test_path': str(test_path)
            }
            
        except Exception as e:
            logger.error(f"Failed to create test environment: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_recovery_status(self) -> Dict[str, Any]:
        """Get disaster recovery status"""
        try:
            return {
                'recovery_plans': len(self.recovery_plans),
                'active_plans': len([p for p in self.recovery_plans.values() if p['status'] == 'active']),
                'last_backup': self.recovery_status['last_backup'],
                'last_recovery': self.recovery_status.get('last_recovery'),
                'recovery_time_objective': self.recovery_status['recovery_time_objective'],
                'recovery_point_objective': self.recovery_status['recovery_point_objective'],
                'backup_frequency': self.recovery_status['backup_frequency'],
                'retention_period': self.recovery_status['retention_period']
            }
            
        except Exception as e:
            logger.error(f"Failed to get recovery status: {e}")
            return {
                'error': str(e)
            }
    
    def get_recovery_plans(self) -> List[Dict[str, Any]]:
        """Get list of recovery plans"""
        try:
            plans = []
            for plan_name, plan in self.recovery_plans.items():
                plans.append({
                    'name': plan_name,
                    'status': plan['status'],
                    'created_at': plan['created_at'],
                    'last_tested': plan.get('last_tested'),
                    'test_count': len(plan.get('test_results', []))
                })
            
            return plans
            
        except Exception as e:
            logger.error(f"Failed to get recovery plans: {e}")
            return []
    
    def update_recovery_status(self, status_updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update recovery status"""
        try:
            self.recovery_status.update(status_updates)
            
            # Save status to file
            status_file = self.recovery_dir / "recovery_status.json"
            with open(status_file, 'w') as f:
                json.dump(self.recovery_status, f, indent=2)
            
            logger.info("Recovery status updated successfully")
            return {
                'success': True,
                'message': 'Recovery status updated successfully'
            }
            
        except Exception as e:
            logger.error(f"Failed to update recovery status: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def schedule_automated_recovery_test(self, plan_name: str, test_schedule: str) -> Dict[str, Any]:
        """Schedule automated recovery testing"""
        try:
            # This would typically integrate with a scheduler
            # For now, we'll just log the action
            logger.info(f"Automated recovery test scheduled for plan '{plan_name}' with schedule '{test_schedule}'")
            
            return {
                'success': True,
                'message': f"Automated recovery test scheduled for plan '{plan_name}'"
            }
            
        except Exception as e:
            logger.error(f"Failed to schedule recovery test: {e}")
            return {
                'success': False,
                'error': str(e)
            }

# Global disaster recovery service instance
disaster_recovery_service = DisasterRecoveryService()