"""
Comprehensive form validation utilities
"""
import re
from typing import Any, Dict, List, Optional, Union
from datetime import datetime, date
from pydantic import BaseModel, validator, Field
from app.utils.error_handler import ValidationException

class BaseValidator(BaseModel):
    """Base validator with common validation methods"""
    
    @validator('*', pre=True)
    def validate_strings(cls, v):
        """Validate and sanitize string inputs"""
        if isinstance(v, str):
            # Remove leading/trailing whitespace
            v = v.strip()
            # Check for empty strings
            if not v:
                raise ValueError("Field cannot be empty")
        return v

class StaffValidator(BaseValidator):
    """Staff data validation"""
    employee_code: str = Field(..., min_length=6, max_length=10)
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., max_length=255)
    password: str = Field(..., min_length=8, max_length=100)
    basic_salary: float = Field(..., gt=0)
    incentive_percentage: float = Field(..., ge=0, le=100)
    department: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    
    @validator('employee_code')
    def validate_employee_code(cls, v):
        """Validate employee code format"""
        if not re.match(r'^[A-Z]{3}\d{3}$', v):
            raise ValueError('Employee code must be in format ABC123')
        return v.upper()
    
    @validator('email')
    def validate_email(cls, v):
        """Validate email format"""
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', v):
            raise ValueError('Invalid email format')
        return v.lower()
    
    @validator('password')
    def validate_password(cls, v):
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one number')
        return v
    
    @validator('phone')
    def validate_phone(cls, v):
        """Validate phone number format"""
        if v and not re.match(r'^\+?[\d\s\-\(\)]{10,}$', v):
            raise ValueError('Invalid phone number format')
        return v

class AttendanceValidator(BaseValidator):
    """Attendance data validation"""
    staff_id: int = Field(..., gt=0)
    date: date
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    status: str = Field(..., regex='^(present|absent|half_day)$')
    notes: Optional[str] = Field(None, max_length=500)
    
    @validator('check_out_time')
    def validate_check_out_time(cls, v, values):
        """Validate check-out time is after check-in time"""
        if v and 'check_in_time' in values and values['check_in_time']:
            if v <= values['check_in_time']:
                raise ValueError('Check-out time must be after check-in time')
        return v
    
    @validator('date')
    def validate_date(cls, v):
        """Validate date is not in the future"""
        if v > date.today():
            raise ValueError('Date cannot be in the future')
        return v

class SalesValidator(BaseValidator):
    """Sales data validation"""
    staff_id: int = Field(..., gt=0)
    brand_id: int = Field(..., gt=0)
    sale_amount: float = Field(..., gt=0)
    sale_date: date
    units_sold: int = Field(..., ge=1)
    customer_name: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = Field(None, max_length=500)
    
    @validator('sale_amount')
    def validate_sale_amount(cls, v):
        """Validate sale amount is reasonable"""
        if v > 1000000:  # 1 million limit
            raise ValueError('Sale amount too high')
        return round(v, 2)
    
    @validator('sale_date')
    def validate_sale_date(cls, v):
        """Validate sale date is not in the future"""
        if v > date.today():
            raise ValueError('Sale date cannot be in the future')
        return v

class BrandValidator(BaseValidator):
    """Brand data validation"""
    brand_name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    category: Optional[str] = Field(None, max_length=50)
    is_active: bool = True
    
    @validator('brand_name')
    def validate_brand_name(cls, v):
        """Validate brand name format"""
        if not re.match(r'^[a-zA-Z0-9\s\-&]+$', v):
            raise ValueError('Brand name contains invalid characters')
        return v.title()

class TargetValidator(BaseValidator):
    """Target data validation"""
    staff_id: int = Field(..., gt=0)
    target_amount: float = Field(..., gt=0)
    target_period: str = Field(..., regex='^(monthly|quarterly|yearly)$')
    start_date: date
    end_date: date
    description: Optional[str] = Field(None, max_length=500)
    
    @validator('end_date')
    def validate_end_date(cls, v, values):
        """Validate end date is after start date"""
        if 'start_date' in values and v <= values['start_date']:
            raise ValueError('End date must be after start date')
        return v
    
    @validator('target_amount')
    def validate_target_amount(cls, v):
        """Validate target amount is reasonable"""
        if v > 10000000:  # 10 million limit
            raise ValueError('Target amount too high')
        return round(v, 2)

class AdvanceValidator(BaseValidator):
    """Advance data validation"""
    staff_id: int = Field(..., gt=0)
    advance_amount: float = Field(..., gt=0)
    deduction_periods: int = Field(..., ge=1, le=24)
    reason: Optional[str] = Field(None, max_length=500)
    
    @validator('advance_amount')
    def validate_advance_amount(cls, v):
        """Validate advance amount is reasonable"""
        if v > 500000:  # 5 lakh limit
            raise ValueError('Advance amount too high')
        return round(v, 2)
    
    @validator('deduction_periods')
    def validate_deduction_periods(cls, v):
        """Validate deduction periods"""
        if v < 1 or v > 24:
            raise ValueError('Deduction periods must be between 1 and 24')
        return v

class SalaryValidator(BaseValidator):
    """Salary data validation"""
    staff_id: int = Field(..., gt=0)
    month_year: str = Field(..., regex='^\d{4}-\d{2}$')
    basic_salary: float = Field(..., gt=0)
    working_days: int = Field(..., ge=1, le=31)
    present_days: int = Field(..., ge=0, le=31)
    sunday_count: int = Field(..., ge=0, le=5)
    salary_for_days: float = Field(..., ge=0)
    target_incentive: float = Field(..., ge=0)
    basic_incentive: float = Field(..., ge=0)
    gross_salary: float = Field(..., ge=0)
    advance_deduction: float = Field(..., ge=0)
    net_salary: float = Field(..., ge=0)
    
    @validator('present_days')
    def validate_present_days(cls, v, values):
        """Validate present days is not more than working days"""
        if 'working_days' in values and v > values['working_days']:
            raise ValueError('Present days cannot be more than working days')
        return v
    
    @validator('month_year')
    def validate_month_year(cls, v):
        """Validate month-year format"""
        try:
            year, month = map(int, v.split('-'))
            if year < 2020 or year > 2030:
                raise ValueError('Year must be between 2020 and 2030')
            if month < 1 or month > 12:
                raise ValueError('Month must be between 1 and 12')
        except ValueError:
            raise ValueError('Invalid month-year format. Use YYYY-MM')
        return v

class ExcelUploadValidator(BaseValidator):
    """Excel upload validation"""
    file_path: str
    file_type: str = Field(..., regex='^(sales|attendance|staff)$')
    
    @validator('file_path')
    def validate_file_path(cls, v):
        """Validate file path exists and is accessible"""
        import os
        if not os.path.exists(v):
            raise ValueError('File does not exist')
        if not os.access(v, os.R_OK):
            raise ValueError('File is not readable')
        return v
    
    @validator('file_type')
    def validate_file_type(cls, v):
        """Validate file type is supported"""
        supported_types = ['sales', 'attendance', 'staff']
        if v not in supported_types:
            raise ValueError(f'File type must be one of: {", ".join(supported_types)}')
        return v

class NetworkValidator(BaseValidator):
    """Network validation"""
    client_ip: str
    mac_address: Optional[str] = None
    
    @validator('client_ip')
    def validate_ip_address(cls, v):
        """Validate IP address format"""
        import ipaddress
        try:
            ipaddress.ip_address(v)
        except ValueError:
            raise ValueError('Invalid IP address format')
        return v
    
    @validator('mac_address')
    def validate_mac_address(cls, v):
        """Validate MAC address format"""
        if v and not re.match(r'^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$', v):
            raise ValueError('Invalid MAC address format')
        return v

class DateRangeValidator(BaseValidator):
    """Date range validation"""
    start_date: date
    end_date: date
    
    @validator('end_date')
    def validate_end_date(cls, v, values):
        """Validate end date is after start date"""
        if 'start_date' in values and v <= values['start_date']:
            raise ValueError('End date must be after start date')
        return v
    
    @validator('start_date')
    def validate_start_date(cls, v):
        """Validate start date is not too far in the past"""
        if v < date(2020, 1, 1):
            raise ValueError('Start date cannot be before 2020')
        return v

def validate_form_data(data: Dict[str, Any], validator_class: type) -> Dict[str, Any]:
    """Validate form data using specified validator class"""
    try:
        validated_data = validator_class(**data)
        return validated_data.dict()
    except Exception as e:
        raise ValidationException(
            message=f"Validation failed: {str(e)}",
            error_code="VALIDATION_ERROR",
            details={"field_errors": str(e)}
        )

def validate_required_fields(data: Dict[str, Any], required_fields: List[str]) -> None:
    """Validate that all required fields are present"""
    missing_fields = [field for field in required_fields if field not in data or data[field] is None]
    if missing_fields:
        raise ValidationException(
            message=f"Missing required fields: {', '.join(missing_fields)}",
            error_code="MISSING_FIELDS",
            details={"missing_fields": missing_fields}
        )

def validate_field_lengths(data: Dict[str, Any], field_lengths: Dict[str, int]) -> None:
    """Validate field lengths"""
    for field, max_length in field_lengths.items():
        if field in data and data[field] and len(str(data[field])) > max_length:
            raise ValidationException(
                message=f"Field '{field}' exceeds maximum length of {max_length}",
                error_code="FIELD_TOO_LONG",
                details={"field": field, "max_length": max_length}
            )

def validate_numeric_ranges(data: Dict[str, Any], field_ranges: Dict[str, tuple]) -> None:
    """Validate numeric field ranges"""
    for field, (min_val, max_val) in field_ranges.items():
        if field in data and data[field] is not None:
            value = float(data[field])
            if value < min_val or value > max_val:
                raise ValidationException(
                    message=f"Field '{field}' must be between {min_val} and {max_val}",
                    error_code="VALUE_OUT_OF_RANGE",
                    details={"field": field, "min_value": min_val, "max_value": max_val}
                )

def sanitize_string_input(value: str) -> str:
    """Sanitize string input to prevent XSS and injection attacks"""
    if not isinstance(value, str):
        return value
    
    # Remove HTML tags
    import re
    value = re.sub(r'<[^>]+>', '', value)
    
    # Remove potentially dangerous characters
    dangerous_chars = ['<', '>', '"', "'", '&', ';', '(', ')', '|', '`', '$']
    for char in dangerous_chars:
        value = value.replace(char, '')
    
    # Trim whitespace
    value = value.strip()
    
    return value

def validate_file_upload(file_path: str, allowed_extensions: List[str], max_size: int) -> None:
    """Validate file upload"""
    import os
    
    # Check file exists
    if not os.path.exists(file_path):
        raise ValidationException(
            message="File does not exist",
            error_code="FILE_NOT_FOUND"
        )
    
    # Check file extension
    file_ext = os.path.splitext(file_path)[1].lower()
    if file_ext not in allowed_extensions:
        raise ValidationException(
            message=f"File extension '{file_ext}' not allowed",
            error_code="INVALID_FILE_TYPE",
            details={"allowed_extensions": allowed_extensions}
        )
    
    # Check file size
    file_size = os.path.getsize(file_path)
    if file_size > max_size:
        raise ValidationException(
            message=f"File size {file_size} exceeds maximum {max_size} bytes",
            error_code="FILE_TOO_LARGE",
            details={"file_size": file_size, "max_size": max_size}
        )