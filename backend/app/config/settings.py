from pydantic_settings import BaseSettings
from typing import List, Optional
import os

class Settings(BaseSettings):
    # Database
    database_url: str = "sqlite:///./staff_attendance.db"
    backup_database_url: str = "sqlite:///./backups/backup.db"
    
    # Security
    secret_key: str = "your-secret-key-here-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 480
    bcrypt_rounds: int = 12
    
    # Network Security
    local_network_subnet: str = "192.168.1.0/24"
    allowed_wifi_mac_addresses: List[str] = ["AA:BB:CC:DD:EE:FF", "11:22:33:44:55:66"]
    max_requests_per_minute: int = 60
    session_timeout_minutes: int = 480
    
    # Admin
    admin_employee_code: str = "ADMIN001"
    admin_email: str = "admin@company.com"
    admin_password: str = "admin123"
    admin_name: str = "System Administrator"
    
    # File Upload
    excel_upload_path: str = "./uploads"
    backup_path: str = "./backups"
    log_path: str = "./logs"
    temp_path: str = "./temp"
    max_file_size: int = 10485760  # 10MB
    
    # Application
    debug: bool = True
    app_name: str = "Staff Attendance & Payout System"
    version: str = "1.0.0"
    environment: str = "development"
    
    # Backup Configuration
    auto_backup_enabled: bool = True
    backup_frequency: str = "daily"
    backup_retention_days: int = 30
    backup_compress: bool = True
    
    # Email Configuration
    smtp_host: Optional[str] = None
    smtp_port: int = 587
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_use_tls: bool = True
    email_notifications_enabled: bool = False
    admin_email_notifications: bool = True
    
    # Redis Configuration
    redis_url: str = "redis://localhost:6379/0"
    cache_ttl: int = 3600
    
    # Logging Configuration
    log_level: str = "INFO"
    log_max_size: int = 10485760  # 10MB
    log_backup_count: int = 5
    
    # Performance Configuration
    workers: int = 4
    request_timeout: int = 30
    max_request_size: int = 10485760  # 10MB
    
    # SSL Configuration
    ssl_cert_path: Optional[str] = None
    ssl_key_path: Optional[str] = None
    force_https: bool = False
    
    # Monitoring Configuration
    health_check_enabled: bool = True
    metrics_enabled: bool = True
    
    # CORS Configuration
    cors_origins: List[str] = ["*"]
    cors_credentials: bool = True
    cors_methods: List[str] = ["*"]
    cors_headers: List[str] = ["*"]
    
    class Config:
        env_file = ".env"
        case_sensitive = False

def get_settings() -> Settings:
    return Settings()