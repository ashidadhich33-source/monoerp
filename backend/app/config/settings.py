from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    # Database
    database_url: str = "sqlite:///./staff_attendance.db"
    
    # Security
    secret_key: str = "your-secret-key-here-change-in-production"
    jwt_expiry_hours: int = 8
    
    # Network Security
    local_network_subnet: str = "192.168.1.0/24"
    wifi_mac_addresses: List[str] = ["AA:BB:CC:DD:EE:FF", "11:22:33:44:55:66"]
    
    # Admin
    admin_default_password: str = "changeMe123"
    
    # File Upload
    excel_upload_path: str = "./uploads"
    backup_path: str = "./backups"
    
    # Application
    debug: bool = True
    app_name: str = "Staff Attendance & Payout System"
    version: str = "1.0.0"
    
    class Config:
        env_file = ".env"
        case_sensitive = False

def get_settings() -> Settings:
    return Settings()