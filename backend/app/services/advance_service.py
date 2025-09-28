"""
Advance management service for handling staff advances
"""
from typing import List, Dict, Any, Optional
from datetime import datetime, date
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from app.models.advances import Advances
from app.models.staff import Staff
from app.models.salary import Salary
import logging

logger = logging.getLogger(__name__)

class AdvanceService:
    def __init__(self):
        pass
    
    def create_advance(self, db: Session, advance_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new advance record"""
        try:
            # Validate staff exists
            staff = db.query(Staff).filter(Staff.id == advance_data['staff_id']).first()
            if not staff:
                return {"success": False, "error": "Staff member not found"}
            
            # Create advance record
            advance = Advances(
                staff_id=advance_data['staff_id'],
                advance_amount=advance_data['advance_amount'],
                deduction_periods=advance_data['deduction_periods'],
                reason=advance_data.get('reason', ''),
                status='pending',
                created_at=datetime.now()
            )
            
            db.add(advance)
            db.commit()
            
            return {
                "success": True,
                "advance_id": advance.id,
                "message": "Advance created successfully"
            }
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to create advance: {e}")
            return {"success": False, "error": str(e)}
    
    def get_staff_advances(self, db: Session, staff_id: int) -> List[Dict[str, Any]]:
        """Get all advances for a specific staff member"""
        try:
            advances = db.query(Advances).filter(Advances.staff_id == staff_id).order_by(desc(Advances.created_at)).all()
            
            return [
                {
                    "id": advance.id,
                    "advance_amount": advance.advance_amount,
                    "deduction_periods": advance.deduction_periods,
                    "reason": advance.reason,
                    "status": advance.status,
                    "created_at": advance.created_at.isoformat(),
                    "remaining_amount": self.calculate_remaining_amount(db, advance.id)
                }
                for advance in advances
            ]
            
        except Exception as e:
            logger.error(f"Failed to get staff advances: {e}")
            return []
    
    def get_all_advances(self, db: Session, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get all advances with optional status filter"""
        try:
            query = db.query(Advances)
            if status:
                query = query.filter(Advances.status == status)
            
            advances = query.order_by(desc(Advances.created_at)).all()
            
            result = []
            for advance in advances:
                staff = db.query(Staff).filter(Staff.id == advance.staff_id).first()
                result.append({
                    "id": advance.id,
                    "staff_name": staff.name if staff else "Unknown",
                    "advance_amount": advance.advance_amount,
                    "deduction_periods": advance.deduction_periods,
                    "reason": advance.reason,
                    "status": advance.status,
                    "created_at": advance.created_at.isoformat(),
                    "remaining_amount": self.calculate_remaining_amount(db, advance.id)
                })
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to get all advances: {e}")
            return []
    
    def approve_advance(self, db: Session, advance_id: int) -> Dict[str, Any]:
        """Approve an advance request"""
        try:
            advance = db.query(Advances).filter(Advances.id == advance_id).first()
            if not advance:
                return {"success": False, "error": "Advance not found"}
            
            if advance.status != 'pending':
                return {"success": False, "error": "Advance is not in pending status"}
            
            advance.status = 'approved'
            advance.approved_at = datetime.now()
            
            db.commit()
            
            return {"success": True, "message": "Advance approved successfully"}
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to approve advance: {e}")
            return {"success": False, "error": str(e)}
    
    def reject_advance(self, db: Session, advance_id: int, reason: str = "") -> Dict[str, Any]:
        """Reject an advance request"""
        try:
            advance = db.query(Advances).filter(Advances.id == advance_id).first()
            if not advance:
                return {"success": False, "error": "Advance not found"}
            
            if advance.status != 'pending':
                return {"success": False, "error": "Advance is not in pending status"}
            
            advance.status = 'rejected'
            advance.rejection_reason = reason
            advance.rejected_at = datetime.now()
            
            db.commit()
            
            return {"success": True, "message": "Advance rejected successfully"}
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to reject advance: {e}")
            return {"success": False, "error": str(e)}
    
    def calculate_remaining_amount(self, db: Session, advance_id: int) -> float:
        """Calculate remaining amount to be deducted from advance"""
        try:
            advance = db.query(Advances).filter(Advances.id == advance_id).first()
            if not advance:
                return 0.0
            
            # Calculate total deducted amount from salary records
            total_deducted = db.query(Salary).filter(
                and_(
                    Salary.staff_id == advance.staff_id,
                    Salary.advance_deduction > 0
                )
            ).with_entities(Salary.advance_deduction).all()
            
            total_deducted_amount = sum([record[0] for record in total_deducted])
            remaining = advance.advance_amount - total_deducted_amount
            
            return max(0.0, remaining)
            
        except Exception as e:
            logger.error(f"Failed to calculate remaining amount: {e}")
            return 0.0
    
    def get_advance_deduction_schedule(self, db: Session, advance_id: int) -> List[Dict[str, Any]]:
        """Get deduction schedule for an advance"""
        try:
            advance = db.query(Advances).filter(Advances.id == advance_id).first()
            if not advance:
                return []
            
            # Calculate monthly deduction amount
            monthly_deduction = advance.advance_amount / advance.deduction_periods
            
            schedule = []
            for i in range(advance.deduction_periods):
                deduction_date = advance.created_at.replace(day=1)  # Start from next month
                deduction_date = deduction_date.replace(month=deduction_date.month + i + 1)
                
                schedule.append({
                    "period": i + 1,
                    "deduction_amount": monthly_deduction,
                    "deduction_date": deduction_date.isoformat(),
                    "status": "pending"
                })
            
            return schedule
            
        except Exception as e:
            logger.error(f"Failed to get deduction schedule: {e}")
            return []
    
    def update_advance_deduction(self, db: Session, advance_id: int, deduction_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update advance deduction in salary calculation"""
        try:
            advance = db.query(Advances).filter(Advances.id == advance_id).first()
            if not advance:
                return {"success": False, "error": "Advance not found"}
            
            # Update deduction amount
            advance.deduction_amount = deduction_data.get('deduction_amount', advance.deduction_amount)
            advance.updated_at = datetime.now()
            
            db.commit()
            
            return {"success": True, "message": "Advance deduction updated successfully"}
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to update advance deduction: {e}")
            return {"success": False, "error": str(e)}
    
    def get_advance_statistics(self, db: Session) -> Dict[str, Any]:
        """Get advance statistics"""
        try:
            total_advances = db.query(Advances).count()
            pending_advances = db.query(Advances).filter(Advances.status == 'pending').count()
            approved_advances = db.query(Advances).filter(Advances.status == 'approved').count()
            rejected_advances = db.query(Advances).filter(Advances.status == 'rejected').count()
            
            total_amount = db.query(Advances).with_entities(Advances.advance_amount).all()
            total_amount = sum([record[0] for record in total_amount])
            
            return {
                "total_advances": total_advances,
                "pending_advances": pending_advances,
                "approved_advances": approved_advances,
                "rejected_advances": rejected_advances,
                "total_amount": total_amount
            }
            
        except Exception as e:
            logger.error(f"Failed to get advance statistics: {e}")
            return {}

# Global advance service instance
advance_service = AdvanceService()