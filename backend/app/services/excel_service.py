"""
Excel upload and processing service
"""
import pandas as pd
import openpyxl
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging
from sqlalchemy.orm import Session
from app.models.sales import Sales
from app.models.staff import Staff
from app.models.brands import Brands
from app.models.base import get_db

logger = logging.getLogger(__name__)

class ExcelService:
    def __init__(self):
        self.supported_formats = ['.xlsx', '.xls']
        self.max_file_size = 10 * 1024 * 1024  # 10MB
    
    def validate_file(self, file_path: str) -> bool:
        """Validate uploaded Excel file"""
        try:
            # Check file extension
            if not any(file_path.lower().endswith(ext) for ext in self.supported_formats):
                return False
            
            # Check file size
            import os
            if os.path.getsize(file_path) > self.max_file_size:
                return False
            
            # Try to open the file
            workbook = openpyxl.load_workbook(file_path)
            return True
        except Exception as e:
            logger.error(f"File validation failed: {e}")
            return False
    
    def process_sales_excel(self, file_path: str, db: Session) -> Dict[str, Any]:
        """Process sales Excel file and import data"""
        try:
            # Read Excel file
            df = pd.read_excel(file_path)
            
            # Validate required columns
            required_columns = ['Staff Name', 'Brand', 'Sale Amount', 'Sale Date', 'Units Sold']
            missing_columns = [col for col in required_columns if col not in df.columns]
            
            if missing_columns:
                return {
                    "success": False,
                    "error": f"Missing required columns: {', '.join(missing_columns)}"
                }
            
            # Process each row
            processed_count = 0
            errors = []
            
            for index, row in df.iterrows():
                try:
                    # Get or create staff
                    staff = db.query(Staff).filter(Staff.name == row['Staff Name']).first()
                    if not staff:
                        errors.append(f"Row {index + 2}: Staff '{row['Staff Name']}' not found")
                        continue
                    
                    # Get or create brand
                    brand = db.query(Brands).filter(Brands.brand_name == row['Brand']).first()
                    if not brand:
                        brand = Brands(brand_name=row['Brand'])
                        db.add(brand)
                        db.flush()
                    
                    # Parse sale date
                    sale_date = pd.to_datetime(row['Sale Date']).date()
                    
                    # Create sales record
                    sales_record = Sales(
                        staff_id=staff.id,
                        brand_id=brand.id,
                        sale_amount=float(row['Sale Amount']),
                        sale_date=sale_date,
                        units_sold=int(row['Units Sold']),
                        created_at=datetime.now()
                    )
                    
                    db.add(sales_record)
                    processed_count += 1
                    
                except Exception as e:
                    errors.append(f"Row {index + 2}: {str(e)}")
            
            # Commit all changes
            db.commit()
            
            return {
                "success": True,
                "processed_count": processed_count,
                "errors": errors,
                "message": f"Successfully processed {processed_count} sales records"
            }
            
        except Exception as e:
            db.rollback()
            logger.error(f"Excel processing failed: {e}")
            return {
                "success": False,
                "error": f"Failed to process Excel file: {str(e)}"
            }
    
    def process_attendance_excel(self, file_path: str, db: Session) -> Dict[str, Any]:
        """Process attendance Excel file and import data"""
        try:
            # Read Excel file
            df = pd.read_excel(file_path)
            
            # Validate required columns
            required_columns = ['Staff Name', 'Date', 'Check In', 'Check Out', 'Status']
            missing_columns = [col for col in required_columns if col not in df.columns]
            
            if missing_columns:
                return {
                    "success": False,
                    "error": f"Missing required columns: {', '.join(missing_columns)}"
                }
            
            # Process each row
            processed_count = 0
            errors = []
            
            for index, row in df.iterrows():
                try:
                    # Get staff
                    staff = db.query(Staff).filter(Staff.name == row['Staff Name']).first()
                    if not staff:
                        errors.append(f"Row {index + 2}: Staff '{row['Staff Name']}' not found")
                        continue
                    
                    # Parse dates and times
                    date = pd.to_datetime(row['Date']).date()
                    check_in = pd.to_datetime(row['Check In']) if pd.notna(row['Check In']) else None
                    check_out = pd.to_datetime(row['Check Out']) if pd.notna(row['Check Out']) else None
                    
                    # Create attendance record
                    from app.models.attendance import Attendance
                    attendance_record = Attendance(
                        staff_id=staff.id,
                        date=date,
                        check_in_time=check_in,
                        check_out_time=check_out,
                        status=row['Status'],
                        created_at=datetime.now()
                    )
                    
                    db.add(attendance_record)
                    processed_count += 1
                    
                except Exception as e:
                    errors.append(f"Row {index + 2}: {str(e)}")
            
            # Commit all changes
            db.commit()
            
            return {
                "success": True,
                "processed_count": processed_count,
                "errors": errors,
                "message": f"Successfully processed {processed_count} attendance records"
            }
            
        except Exception as e:
            db.rollback()
            logger.error(f"Attendance Excel processing failed: {e}")
            return {
                "success": False,
                "error": f"Failed to process attendance Excel file: {str(e)}"
            }
    
    def export_sales_to_excel(self, sales_data: List[Dict], file_path: str) -> bool:
        """Export sales data to Excel file"""
        try:
            df = pd.DataFrame(sales_data)
            df.to_excel(file_path, index=False)
            return True
        except Exception as e:
            logger.error(f"Excel export failed: {e}")
            return False
    
    def export_attendance_to_excel(self, attendance_data: List[Dict], file_path: str) -> bool:
        """Export attendance data to Excel file"""
        try:
            df = pd.DataFrame(attendance_data)
            df.to_excel(file_path, index=False)
            return True
        except Exception as e:
            logger.error(f"Attendance Excel export failed: {e}")
            return False
    
    def get_excel_template(self, template_type: str) -> str:
        """Get Excel template for download"""
        templates = {
            "sales": {
                "columns": ["Staff Name", "Brand", "Sale Amount", "Sale Date", "Units Sold"],
                "sample_data": [
                    ["John Doe", "Brand A", 10000, "2024-01-15", 5],
                    ["Jane Smith", "Brand B", 15000, "2024-01-15", 3]
                ]
            },
            "attendance": {
                "columns": ["Staff Name", "Date", "Check In", "Check Out", "Status"],
                "sample_data": [
                    ["John Doe", "2024-01-15", "09:00:00", "18:00:00", "present"],
                    ["Jane Smith", "2024-01-15", "09:30:00", "17:30:00", "present"]
                ]
            }
        }
        
        if template_type not in templates:
            raise ValueError(f"Unknown template type: {template_type}")
        
        template = templates[template_type]
        df = pd.DataFrame(template["sample_data"], columns=template["columns"])
        
        # Save to temporary file
        import tempfile
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx')
        df.to_excel(temp_file.name, index=False)
        temp_file.close()
        
        return temp_file.name

# Global Excel service instance
excel_service = ExcelService()