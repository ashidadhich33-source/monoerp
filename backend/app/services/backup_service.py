"""
Backup service for automated backups and disaster recovery
"""
import os
import shutil
import zipfile
import json
from datetime import datetime
from typing import Dict, List, Any, Optional
import logging
from pathlib import Path
from sqlalchemy.orm import Session
from app.models.base import get_db
from app.config.settings import get_settings

logger = logging.getLogger(__name__)

class BackupService:
    def __init__(self):
        self.settings = get_settings()
        self.backup_dir = Path(self.settings.backup_path)
        self.backup_dir.mkdir(exist_ok=True)
    
    def create_backup(self, backup_type: str = "manual") -> Dict[str, Any]:
        """Create a system backup"""
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_name = f"{backup_type}_{timestamp}"
            backup_path = self.backup_dir / f"{backup_name}.zip"
            
            # Create backup archive
            with zipfile.ZipFile(backup_path, 'w', zipfile.ZIP_DEFLATED) as backup_zip:
                # Backup database
                self._backup_database(backup_zip)
                
                # Backup configuration files
                self._backup_config(backup_zip)
                
                # Backup uploaded files
                self._backup_uploads(backup_zip)
                
                # Backup logs
                self._backup_logs(backup_zip)
            
            # Create backup metadata
            metadata = {
                'backup_type': backup_type,
                'created_at': datetime.now().isoformat(),
                'size': backup_path.stat().st_size,
                'files_included': self._get_backup_contents(backup_path)
            }
            
            # Save metadata
            metadata_path = self.backup_dir / f"{backup_name}_metadata.json"
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=2)
            
            logger.info(f"Backup created successfully: {backup_name}")
            return {
                'success': True,
                'backup_name': backup_name,
                'filename': backup_path.name,
                'size': backup_path.stat().st_size,
                'metadata': metadata
            }
            
        except Exception as e:
            logger.error(f"Failed to create backup: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _backup_database(self, backup_zip: zipfile.ZipFile):
        """Backup database"""
        try:
            # Export database to SQL
            db_path = self.settings.database_url.replace("sqlite:///", "")
            if os.path.exists(db_path):
                backup_zip.write(db_path, "database/database.db")
                logger.info("Database backed up successfully")
        except Exception as e:
            logger.error(f"Failed to backup database: {e}")
    
    def _backup_config(self, backup_zip: zipfile.ZipFile):
        """Backup configuration files"""
        try:
            config_files = [
                "app/config/settings.py",
                "app/config/database.py",
                "requirements.txt",
                "requirements-test.txt",
                "pytest.ini"
            ]
            
            for config_file in config_files:
                if os.path.exists(config_file):
                    backup_zip.write(config_file, f"config/{os.path.basename(config_file)}")
            
            logger.info("Configuration files backed up successfully")
        except Exception as e:
            logger.error(f"Failed to backup config: {e}")
    
    def _backup_uploads(self, backup_zip: zipfile.ZipFile):
        """Backup uploaded files"""
        try:
            uploads_dir = Path(self.settings.uploads_directory)
            if uploads_dir.exists():
                for file_path in uploads_dir.rglob("*"):
                    if file_path.is_file():
                        arcname = f"uploads/{file_path.relative_to(uploads_dir)}"
                        backup_zip.write(file_path, arcname)
            
            logger.info("Uploaded files backed up successfully")
        except Exception as e:
            logger.error(f"Failed to backup uploads: {e}")
    
    def _backup_logs(self, backup_zip: zipfile.ZipFile):
        """Backup log files"""
        try:
            logs_dir = Path("logs")
            if logs_dir.exists():
                for file_path in logs_dir.rglob("*.log"):
                    if file_path.is_file():
                        arcname = f"logs/{file_path.relative_to(logs_dir)}"
                        backup_zip.write(file_path, arcname)
            
            logger.info("Log files backed up successfully")
        except Exception as e:
            logger.error(f"Failed to backup logs: {e}")
    
    def _get_backup_contents(self, backup_path: Path) -> List[str]:
        """Get list of files in backup"""
        try:
            with zipfile.ZipFile(backup_path, 'r') as backup_zip:
                return backup_zip.namelist()
        except Exception as e:
            logger.error(f"Failed to get backup contents: {e}")
            return []
    
    def restore_backup(self, backup_filename: str) -> Dict[str, Any]:
        """Restore from backup"""
        try:
            backup_path = self.backup_dir / backup_filename
            if not backup_path.exists():
                return {
                    'success': False,
                    'error': f"Backup file not found: {backup_filename}"
                }
            
            # Extract backup
            with zipfile.ZipFile(backup_path, 'r') as backup_zip:
                backup_zip.extractall(self.backup_dir / "restore_temp")
            
            # Restore database
            self._restore_database(backup_path)
            
            # Restore configuration
            self._restore_config(backup_path)
            
            # Restore uploads
            self._restore_uploads(backup_path)
            
            # Clean up temporary files
            shutil.rmtree(self.backup_dir / "restore_temp")
            
            logger.info(f"Backup restored successfully: {backup_filename}")
            return {
                'success': True,
                'message': f"Backup {backup_filename} restored successfully"
            }
            
        except Exception as e:
            logger.error(f"Failed to restore backup: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _restore_database(self, backup_path: Path):
        """Restore database from backup"""
        try:
            with zipfile.ZipFile(backup_path, 'r') as backup_zip:
                if "database/database.db" in backup_zip.namelist():
                    # Extract database
                    backup_zip.extract("database/database.db", self.backup_dir / "restore_temp")
                    
                    # Replace current database
                    current_db_path = self.settings.database_url.replace("sqlite:///", "")
                    if os.path.exists(current_db_path):
                        os.remove(current_db_path)
                    
                    shutil.move(
                        self.backup_dir / "restore_temp" / "database" / "database.db",
                        current_db_path
                    )
                    
                    logger.info("Database restored successfully")
        except Exception as e:
            logger.error(f"Failed to restore database: {e}")
    
    def _restore_config(self, backup_path: Path):
        """Restore configuration files"""
        try:
            with zipfile.ZipFile(backup_path, 'r') as backup_zip:
                config_files = [f for f in backup_zip.namelist() if f.startswith("config/")]
                
                for config_file in config_files:
                    backup_zip.extract(config_file, self.backup_dir / "restore_temp")
                    
                    # Restore to original location
                    original_path = config_file.replace("config/", "")
                    if os.path.exists(original_path):
                        os.remove(original_path)
                    
                    shutil.move(
                        self.backup_dir / "restore_temp" / config_file,
                        original_path
                    )
                
                logger.info("Configuration files restored successfully")
        except Exception as e:
            logger.error(f"Failed to restore config: {e}")
    
    def _restore_uploads(self, backup_path: Path):
        """Restore uploaded files"""
        try:
            with zipfile.ZipFile(backup_path, 'r') as backup_zip:
                upload_files = [f for f in backup_zip.namelist() if f.startswith("uploads/")]
                
                for upload_file in upload_files:
                    backup_zip.extract(upload_file, self.backup_dir / "restore_temp")
                    
                    # Restore to uploads directory
                    uploads_dir = Path(self.settings.uploads_directory)
                    uploads_dir.mkdir(exist_ok=True)
                    
                    relative_path = upload_file.replace("uploads/", "")
                    target_path = uploads_dir / relative_path
                    target_path.parent.mkdir(parents=True, exist_ok=True)
                    
                    if target_path.exists():
                        os.remove(target_path)
                    
                    shutil.move(
                        self.backup_dir / "restore_temp" / upload_file,
                        target_path
                    )
                
                logger.info("Uploaded files restored successfully")
        except Exception as e:
            logger.error(f"Failed to restore uploads: {e}")
    
    def list_backups(self) -> List[Dict[str, Any]]:
        """List all available backups"""
        try:
            backups = []
            
            for backup_file in self.backup_dir.glob("*.zip"):
                metadata_file = self.backup_dir / f"{backup_file.stem}_metadata.json"
                
                backup_info = {
                    'filename': backup_file.name,
                    'size': backup_file.stat().st_size,
                    'created_at': datetime.fromtimestamp(backup_file.stat().st_mtime).isoformat()
                }
                
                if metadata_file.exists():
                    with open(metadata_file, 'r') as f:
                        metadata = json.load(f)
                        backup_info.update(metadata)
                
                backups.append(backup_info)
            
            # Sort by creation time (newest first)
            backups.sort(key=lambda x: x['created_at'], reverse=True)
            return backups
            
        except Exception as e:
            logger.error(f"Failed to list backups: {e}")
            return []
    
    def delete_backup(self, backup_filename: str) -> Dict[str, Any]:
        """Delete a backup"""
        try:
            backup_path = self.backup_dir / backup_filename
            metadata_path = self.backup_dir / f"{backup_path.stem}_metadata.json"
            
            if backup_path.exists():
                backup_path.unlink()
                logger.info(f"Backup file deleted: {backup_filename}")
            
            if metadata_path.exists():
                metadata_path.unlink()
                logger.info(f"Metadata file deleted: {metadata_path.name}")
            
            return {
                'success': True,
                'message': f"Backup {backup_filename} deleted successfully"
            }
            
        except Exception as e:
            logger.error(f"Failed to delete backup: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def cleanup_old_backups(self, days_to_keep: int = 30) -> Dict[str, Any]:
        """Clean up old backups"""
        try:
            cutoff_date = datetime.now() - timedelta(days=days_to_keep)
            deleted_count = 0
            
            for backup_file in self.backup_dir.glob("*.zip"):
                file_time = datetime.fromtimestamp(backup_file.stat().st_mtime)
                
                if file_time < cutoff_date:
                    self.delete_backup(backup_file.name)
                    deleted_count += 1
            
            logger.info(f"Cleaned up {deleted_count} old backups")
            return {
                'success': True,
                'deleted_count': deleted_count,
                'message': f"Cleaned up {deleted_count} old backups"
            }
            
        except Exception as e:
            logger.error(f"Failed to cleanup old backups: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_backup_status(self) -> Dict[str, Any]:
        """Get backup service status"""
        try:
            backups = self.list_backups()
            total_size = sum(backup['size'] for backup in backups)
            
            return {
                'total_backups': len(backups),
                'total_size': total_size,
                'backup_directory': str(self.backup_dir),
                'latest_backup': backups[0]['created_at'] if backups else None,
                'oldest_backup': backups[-1]['created_at'] if backups else None
            }
            
        except Exception as e:
            logger.error(f"Failed to get backup status: {e}")
            return {
                'error': str(e)
            }

# Global backup service instance
backup_service = BackupService()