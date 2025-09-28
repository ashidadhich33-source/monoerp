from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.models.company import Company
from app.models.setup_state import SetupState
from app.models.staff import Staff
from app.utils.auth import get_password_hash
from datetime import datetime
import json
import logging

logger = logging.getLogger(__name__)

class SetupService:
    """Service for handling system setup operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def check_setup_status(self):
        """Check if system setup is complete"""
        try:
            # Check if company exists
            company = self.db.query(Company).first()
            if not company:
                return {"is_setup_complete": False, "message": "No company found"}
            
            # Check if admin user exists
            admin = self.db.query(Staff).filter(Staff.is_admin == True).first()
            if not admin:
                return {"is_setup_complete": False, "message": "No admin user found"}
            
            # Check setup state
            setup_state = self.db.query(SetupState).first()
            if setup_state and setup_state.is_setup_complete():
                return {
                    "is_setup_complete": True,
                    "message": "Setup complete",
                    "company": company.to_dict(),
                    "admin": {
                        "name": admin.name,
                        "email": admin.email,
                        "employee_code": admin.employee_code
                    }
                }
            
            return {"is_setup_complete": False, "message": "Setup incomplete"}
            
        except SQLAlchemyError as e:
            logger.error(f"Error checking setup status: {e}")
            return {"is_setup_complete": False, "message": f"Database error: {str(e)}"}
        except Exception as e:
            logger.error(f"Unexpected error checking setup status: {e}")
            return {"is_setup_complete": False, "message": f"Unexpected error: {str(e)}"}
    
    def create_company(self, company_data: dict):
        """Create company and return company info"""
        try:
            # Check if company already exists
            existing_company = self.db.query(Company).first()
            if existing_company:
                return {"success": False, "message": "Company already exists"}
            
            # Create new company
            company = Company(
                name=company_data["name"],
                address=company_data.get("address", ""),
                phone=company_data.get("phone", ""),
                industry_type=company_data.get("industry_type", ""),
                timezone=company_data.get("timezone", "UTC"),
                currency=company_data.get("currency", "USD"),
                working_hours_start=company_data.get("working_hours_start", "09:00"),
                working_hours_end=company_data.get("working_hours_end", "17:00")
            )
            
            self.db.add(company)
            self.db.commit()
            self.db.refresh(company)
            
            # Update setup state
            self._update_setup_state("company_created", True)
            
            logger.info(f"Company created successfully: {company.name}")
            return {"success": True, "company": company.to_dict()}
            
        except SQLAlchemyError as e:
            logger.error(f"Error creating company: {e}")
            self.db.rollback()
            return {"success": False, "message": f"Database error: {str(e)}"}
        except Exception as e:
            logger.error(f"Unexpected error creating company: {e}")
            self.db.rollback()
            return {"success": False, "message": f"Unexpected error: {str(e)}"}
    
    def create_admin_user(self, admin_data: dict):
        """Create admin user and return admin info"""
        try:
            # Check if admin already exists
            existing_admin = self.db.query(Staff).filter(Staff.is_admin == True).first()
            if existing_admin:
                return {"success": False, "message": "Admin user already exists"}
            
            # Generate employee code for admin
            employee_code = f"ADMIN{datetime.now().strftime('%Y%m%d%H%M%S')}"
            
            # Create admin user
            admin = Staff(
                employee_code=employee_code,
                name=admin_data["name"],
                email=admin_data["email"],
                password_hash=get_password_hash(admin_data["password"]),
                phone=admin_data.get("phone", ""),
                basic_salary=0.0,
                incentive_percentage=0.0,
                joining_date=datetime.now().date(),
                is_active=True,
                is_admin=True
            )
            
            self.db.add(admin)
            self.db.commit()
            self.db.refresh(admin)
            
            # Update setup state
            self._update_setup_state("admin_created", True)
            
            logger.info(f"Admin user created successfully: {admin.name}")
            return {
                "success": True,
                "admin": {
                    "name": admin.name,
                    "email": admin.email,
                    "employee_code": admin.employee_code
                }
            }
            
        except SQLAlchemyError as e:
            logger.error(f"Error creating admin user: {e}")
            self.db.rollback()
            return {"success": False, "message": f"Database error: {str(e)}"}
        except Exception as e:
            logger.error(f"Unexpected error creating admin user: {e}")
            self.db.rollback()
            return {"success": False, "message": f"Unexpected error: {str(e)}"}
    
    def complete_setup(self, setup_data: dict):
        """Complete the setup process"""
        try:
            # Update company setup completion
            company = self.db.query(Company).first()
            if company:
                company.is_setup_complete = True
                company.setup_completed_at = datetime.now()
                self.db.commit()
            
            # Update setup state
            self._update_setup_state("system_configured", True)
            self._update_setup_state("database_initialized", True)
            
            # Store setup data
            setup_state = self.db.query(SetupState).first()
            if setup_state:
                setup_state.setup_data = json.dumps(setup_data)
                setup_state.completed_at = datetime.now()
                self.db.commit()
            
            logger.info("Setup completed successfully")
            return {"success": True, "message": "Setup completed successfully"}
            
        except SQLAlchemyError as e:
            logger.error(f"Error completing setup: {e}")
            self.db.rollback()
            return {"success": False, "message": f"Database error: {str(e)}"}
        except Exception as e:
            logger.error(f"Unexpected error completing setup: {e}")
            self.db.rollback()
            return {"success": False, "message": f"Unexpected error: {str(e)}"}
    
    def _update_setup_state(self, field: str, value: bool):
        """Update setup state field"""
        try:
            setup_state = self.db.query(SetupState).first()
            if not setup_state:
                setup_state = SetupState()
                self.db.add(setup_state)
            
            setattr(setup_state, field, value)
            self.db.commit()
            
        except Exception as e:
            logger.error(f"Error updating setup state: {e}")
            self.db.rollback()
    
    def reset_setup(self):
        """Reset setup state (for testing purposes)"""
        try:
            # Delete all data
            self.db.query(Staff).delete()
            self.db.query(Company).delete()
            self.db.query(SetupState).delete()
            self.db.commit()
            
            logger.info("Setup reset successfully")
            return {"success": True, "message": "Setup reset successfully"}
            
        except SQLAlchemyError as e:
            logger.error(f"Error resetting setup: {e}")
            self.db.rollback()
            return {"success": False, "message": f"Database error: {str(e)}"}
        except Exception as e:
            logger.error(f"Unexpected error resetting setup: {e}")
            self.db.rollback()
            return {"success": False, "message": f"Unexpected error: {str(e)}"}