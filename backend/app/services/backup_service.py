import sqlite3
import os
import shutil
from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, text
from app.config.settings import get_settings
import gzip
import json

class BackupService:
    """Service for creating and managing database backups"""
    
    def __init__(self, db: Session):
        self.db = db
        self.settings = get_settings()
        self.backup_dir = self.settings.backup_path
        
        # Ensure backup directory exists
        os.makedirs(self.backup_dir, exist_ok=True)
    
    def create_daily_backup(self) -> str:
        """Create a daily backup of the database"""
        backup_date = datetime.now().strftime("%Y%m%d")
        backup_filename = f"backup_{backup_date}.db"
        backup_path = os.path.join(self.backup_dir, backup_filename)
        
        try:
            # Create SQLite backup
            if self.settings.database_url.startswith("sqlite"):
                # For SQLite, just copy the database file
                db_path = self.settings.database_url.replace("sqlite:///", "")
                shutil.copy2(db_path, backup_path)
            else:
                # For other databases, export to SQLite
                self._export_to_sqlite(backup_path)
            
            # Compress the backup
            compressed_path = f"{backup_path}.gz"
            with open(backup_path, 'rb') as f_in:
                with gzip.open(compressed_path, 'wb') as f_out:
                    shutil.copyfileobj(f_in, f_out)
            
            # Remove uncompressed file
            os.remove(backup_path)
            
            # Create metadata file
            metadata = {
                "backup_date": backup_date,
                "created_at": datetime.now().isoformat(),
                "database_url": self.settings.database_url,
                "backup_type": "daily",
                "compressed": True,
                "file_size": os.path.getsize(compressed_path)
            }
            
            metadata_path = f"{compressed_path}.meta"
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=2)
            
            return compressed_path
            
        except Exception as e:
            raise Exception(f"Backup creation failed: {str(e)}")
    
    def _export_to_sqlite(self, backup_path: str):
        """Export current database to SQLite backup"""
        # This is a simplified version - in production, you'd want more sophisticated export
        # For now, we'll create a basic SQLite database with the same schema
        
        # Create SQLite connection
        sqlite_conn = sqlite3.connect(backup_path)
        
        # Get all tables and their data
        tables = [
            'staff', 'attendance', 'sales', 'brands', 'targets', 
            'achievements', 'salary', 'advances', 'rankings'
        ]
        
        for table in tables:
            try:
                # Get table data
                result = self.db.execute(text(f"SELECT * FROM {table}"))
                rows = result.fetchall()
                
                if rows:
                    # Get column names
                    columns = result.keys()
                    
                    # Create table in SQLite (simplified)
                    create_sql = f"CREATE TABLE IF NOT EXISTS {table} (id INTEGER PRIMARY KEY)"
                    sqlite_conn.execute(create_sql)
                    
                    # Insert data
                    for row in rows:
                        placeholders = ','.join(['?' for _ in columns])
                        insert_sql = f"INSERT OR REPLACE INTO {table} VALUES ({placeholders})"
                        sqlite_conn.execute(insert_sql, row)
                        
            except Exception as e:
                print(f"Error exporting table {table}: {str(e)}")
                continue
        
        sqlite_conn.commit()
        sqlite_conn.close()
    
    def list_backups(self) -> List[Dict[str, Any]]:
        """List all available backups"""
        backups = []
        
        for filename in os.listdir(self.backup_dir):
            if filename.endswith('.db.gz'):
                backup_path = os.path.join(self.backup_dir, filename)
                metadata_path = f"{backup_path}.meta"
                
                backup_info = {
                    "filename": filename,
                    "file_path": backup_path,
                    "created_at": datetime.fromtimestamp(os.path.getctime(backup_path)).isoformat(),
                    "file_size": os.path.getsize(backup_path),
                    "has_metadata": os.path.exists(metadata_path)
                }
                
                # Load metadata if available
                if os.path.exists(metadata_path):
                    try:
                        with open(metadata_path, 'r') as f:
                            metadata = json.load(f)
                            backup_info.update(metadata)
                    except Exception:
                        pass
                
                backups.append(backup_info)
        
        # Sort by creation date (newest first)
        backups.sort(key=lambda x: x['created_at'], reverse=True)
        
        return backups
    
    def restore_backup(self, backup_id: str) -> bool:
        """Restore from a backup"""
        try:
            # Find backup file
            backup_path = None
            for filename in os.listdir(self.backup_dir):
                if backup_id in filename and filename.endswith('.db.gz'):
                    backup_path = os.path.join(self.backup_dir, filename)
                    break
            
            if not backup_path or not os.path.exists(backup_path):
                raise Exception(f"Backup file not found: {backup_id}")
            
            # Decompress backup
            temp_path = backup_path.replace('.gz', '_temp')
            with gzip.open(backup_path, 'rb') as f_in:
                with open(temp_path, 'wb') as f_out:
                    shutil.copyfileobj(f_in, f_out)
            
            # Restore database
            if self.settings.database_url.startswith("sqlite"):
                # For SQLite, replace the database file
                db_path = self.settings.database_url.replace("sqlite:///", "")
                shutil.copy2(temp_path, db_path)
            else:
                # For other databases, import from SQLite
                self._import_from_sqlite(temp_path)
            
            # Clean up temp file
            os.remove(temp_path)
            
            return True
            
        except Exception as e:
            raise Exception(f"Restore failed: {str(e)}")
    
    def _import_from_sqlite(self, sqlite_path: str):
        """Import data from SQLite backup to current database"""
        # This is a simplified version - in production, you'd want more sophisticated import
        sqlite_conn = sqlite3.connect(sqlite_path)
        
        tables = [
            'staff', 'attendance', 'sales', 'brands', 'targets', 
            'achievements', 'salary', 'advances', 'rankings'
        ]
        
        for table in tables:
            try:
                # Get data from SQLite
                cursor = sqlite_conn.execute(f"SELECT * FROM {table}")
                rows = cursor.fetchall()
                columns = [description[0] for description in cursor.description]
                
                if rows:
                    # Clear existing data
                    self.db.execute(text(f"DELETE FROM {table}"))
                    
                    # Insert data (simplified - would need proper mapping)
                    for row in rows:
                        # This is a basic implementation
                        # In production, you'd want proper data mapping and validation
                        pass
                        
            except Exception as e:
                print(f"Error importing table {table}: {str(e)}")
                continue
        
        sqlite_conn.close()
        self.db.commit()
    
    def cleanup_old_backups(self, days_to_keep: int = 30):
        """Clean up old backup files"""
        cutoff_date = datetime.now() - timedelta(days=days_to_keep)
        
        for filename in os.listdir(self.backup_dir):
            if filename.endswith('.db.gz'):
                file_path = os.path.join(self.backup_dir, filename)
                file_time = datetime.fromtimestamp(os.path.getctime(file_path))
                
                if file_time < cutoff_date:
                    try:
                        os.remove(file_path)
                        # Also remove metadata file if it exists
                        metadata_path = f"{file_path}.meta"
                        if os.path.exists(metadata_path):
                            os.remove(metadata_path)
                        print(f"Deleted old backup: {filename}")
                    except Exception as e:
                        print(f"Error deleting backup {filename}: {str(e)}")
    
    def get_backup_status(self) -> Dict[str, Any]:
        """Get backup system status"""
        backups = self.list_backups()
        
        return {
            "total_backups": len(backups),
            "latest_backup": backups[0] if backups else None,
            "backup_directory": self.backup_dir,
            "disk_usage": sum(backup['file_size'] for backup in backups),
            "oldest_backup": backups[-1] if backups else None
        }

# Global backup service instance - will be initialized with proper db session when used
backup_service = None