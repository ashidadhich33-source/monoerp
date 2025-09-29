import csv
import io
import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
import logging

logger = logging.getLogger(__name__)

class FileService:
    """Service for handling file operations including CSV and PDF generation"""
    
    @staticmethod
    def generate_csv(data: List[Dict[str, Any]], filename: str = None) -> StreamingResponse:
        """Generate CSV file from data"""
        try:
            if not data:
                # Return empty CSV with headers
                output = io.StringIO()
                writer = csv.writer(output)
                writer.writerow(["No data available"])
                output.seek(0)
                return StreamingResponse(
                    io.BytesIO(output.getvalue().encode('utf-8')),
                    media_type="text/csv",
                    headers={"Content-Disposition": f"attachment; filename={filename or 'export.csv'}"}
                )
            
            # Get headers from first row
            headers = list(data[0].keys())
            
            output = io.StringIO()
            writer = csv.DictWriter(output, fieldnames=headers)
            writer.writeheader()
            
            for row in data:
                # Convert any non-string values to strings
                formatted_row = {}
                for key, value in row.items():
                    if isinstance(value, (dict, list)):
                        formatted_row[key] = json.dumps(value)
                    elif value is None:
                        formatted_row[key] = ""
                    else:
                        formatted_row[key] = str(value)
                writer.writerow(formatted_row)
            
            output.seek(0)
            
            return StreamingResponse(
                io.BytesIO(output.getvalue().encode('utf-8')),
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename={filename or 'export.csv'}"}
            )
            
        except Exception as e:
            logger.error(f"Error generating CSV: {e}")
            raise
    
    @staticmethod
    def generate_pdf_report(
        data: List[Dict[str, Any]], 
        title: str, 
        columns: List[Dict[str, str]], 
        filename: str = None
    ) -> StreamingResponse:
        """Generate PDF report from data"""
        try:
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
            
            # Get styles
            styles = getSampleStyleSheet()
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=16,
                spaceAfter=30,
                alignment=TA_CENTER,
                textColor=colors.darkblue
            )
            
            # Build content
            story = []
            
            # Add title
            story.append(Paragraph(title, title_style))
            story.append(Spacer(1, 12))
            
            # Add generation date
            story.append(Paragraph(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
            story.append(Spacer(1, 20))
            
            if not data:
                story.append(Paragraph("No data available for the selected period.", styles['Normal']))
            else:
                # Create table data
                table_data = []
                
                # Add headers
                headers = [col['header'] for col in columns]
                table_data.append(headers)
                
                # Add data rows
                for row in data:
                    table_row = []
                    for col in columns:
                        value = row.get(col['key'], '')
                        if isinstance(value, (dict, list)):
                            value = json.dumps(value)
                        elif value is None:
                            value = ""
                        else:
                            value = str(value)
                        table_row.append(value)
                    table_data.append(table_row)
                
                # Create table
                table = Table(table_data)
                table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 10),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black),
                    ('FONTSIZE', (0, 1), (-1, -1), 8),
                ]))
                
                story.append(table)
            
            # Build PDF
            doc.build(story)
            buffer.seek(0)
            
            return StreamingResponse(
                io.BytesIO(buffer.getvalue()),
                media_type="application/pdf",
                headers={"Content-Disposition": f"attachment; filename={filename or 'report.pdf'}"}
            )
            
        except Exception as e:
            logger.error(f"Error generating PDF: {e}")
            raise
    
    @staticmethod
    def generate_salary_slip_pdf(
        staff_name: str,
        employee_code: str,
        month_year: str,
        basic_salary: float,
        incentives: float,
        advances_deducted: float,
        net_salary: float,
        company_info: Dict[str, str],
        filename: str = None
    ) -> StreamingResponse:
        """Generate salary slip PDF"""
        try:
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
            
            # Get styles
            styles = getSampleStyleSheet()
            title_style = ParagraphStyle(
                'SalarySlipTitle',
                parent=styles['Heading1'],
                fontSize=18,
                spaceAfter=20,
                alignment=TA_CENTER,
                textColor=colors.darkblue
            )
            
            # Build content
            story = []
            
            # Company header
            story.append(Paragraph(company_info.get('name', 'Company Name'), title_style))
            story.append(Paragraph(company_info.get('address', ''), styles['Normal']))
            story.append(Paragraph(f"Phone: {company_info.get('phone', '')}", styles['Normal']))
            story.append(Spacer(1, 20))
            
            # Salary slip title
            story.append(Paragraph("SALARY SLIP", title_style))
            story.append(Spacer(1, 20))
            
            # Employee details
            story.append(Paragraph(f"Employee: {staff_name}", styles['Normal']))
            story.append(Paragraph(f"Employee Code: {employee_code}", styles['Normal']))
            story.append(Paragraph(f"Month: {month_year}", styles['Normal']))
            story.append(Spacer(1, 20))
            
            # Salary details table
            salary_data = [
                ['Description', 'Amount (₹)'],
                ['Basic Salary', f"{basic_salary:,.2f}"],
                ['Incentives', f"{incentives:,.2f}"],
                ['Gross Salary', f"{basic_salary + incentives:,.2f}"],
                ['Advances Deducted', f"{advances_deducted:,.2f}"],
                ['Net Salary', f"{net_salary:,.2f}"]
            ]
            
            table = Table(salary_data)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('FONTSIZE', (0, 1), (-1, -1), 10),
            ]))
            
            story.append(table)
            story.append(Spacer(1, 30))
            
            # Footer
            story.append(Paragraph("This is a computer generated document.", styles['Normal']))
            story.append(Paragraph(f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
            
            # Build PDF
            doc.build(story)
            buffer.seek(0)
            
            return StreamingResponse(
                io.BytesIO(buffer.getvalue()),
                media_type="application/pdf",
                headers={"Content-Disposition": f"attachment; filename={filename or f'salary_slip_{employee_code}_{month_year}.pdf'}"}
            )
            
        except Exception as e:
            logger.error(f"Error generating salary slip PDF: {e}")
            raise

# Create instance
file_service = FileService()