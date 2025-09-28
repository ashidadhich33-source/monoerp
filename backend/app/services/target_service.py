"""
Target management service for handling sales targets
"""
from typing import List, Dict, Any, Optional
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, func
from app.models.targets import Targets
from app.models.staff import Staff
from app.models.sales import Sales
import logging

logger = logging.getLogger(__name__)

class TargetService:
    def __init__(self):
        pass
    
    def create_target(self, db: Session, target_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new target"""
        try:
            # Validate staff exists
            staff = db.query(Staff).filter(Staff.id == target_data['staff_id']).first()
            if not staff:
                return {"success": False, "error": "Staff member not found"}
            
            # Check for overlapping targets
            existing_target = db.query(Targets).filter(
                and_(
                    Targets.staff_id == target_data['staff_id'],
                    Targets.target_period == target_data['target_period'],
                    Targets.start_date <= target_data['end_date'],
                    Targets.end_date >= target_data['start_date']
                )
            ).first()
            
            if existing_target:
                return {"success": False, "error": "Overlapping target exists for this period"}
            
            # Create target
            target = Targets(
                staff_id=target_data['staff_id'],
                target_amount=target_data['target_amount'],
                target_period=target_data['target_period'],
                start_date=target_data['start_date'],
                end_date=target_data['end_date'],
                description=target_data.get('description', ''),
                status='active',
                created_at=datetime.now()
            )
            
            db.add(target)
            db.commit()
            
            return {
                "success": True,
                "target_id": target.id,
                "message": "Target created successfully"
            }
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to create target: {e}")
            return {"success": False, "error": str(e)}
    
    def get_staff_targets(self, db: Session, staff_id: int, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get targets for a specific staff member"""
        try:
            query = db.query(Targets).filter(Targets.staff_id == staff_id)
            if status:
                query = query.filter(Targets.status == status)
            
            targets = query.order_by(desc(Targets.created_at)).all()
            
            result = []
            for target in targets:
                achievement = self.calculate_target_achievement(db, target.id)
                result.append({
                    "id": target.id,
                    "target_amount": target.target_amount,
                    "target_period": target.target_period,
                    "start_date": target.start_date.isoformat(),
                    "end_date": target.end_date.isoformat(),
                    "description": target.description,
                    "status": target.status,
                    "created_at": target.created_at.isoformat(),
                    "achievement": achievement
                })
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to get staff targets: {e}")
            return []
    
    def get_all_targets(self, db: Session, status: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get all targets with optional status filter"""
        try:
            query = db.query(Targets)
            if status:
                query = query.filter(Targets.status == status)
            
            targets = query.order_by(desc(Targets.created_at)).all()
            
            result = []
            for target in targets:
                staff = db.query(Staff).filter(Staff.id == target.staff_id).first()
                achievement = self.calculate_target_achievement(db, target.id)
                result.append({
                    "id": target.id,
                    "staff_name": staff.name if staff else "Unknown",
                    "target_amount": target.target_amount,
                    "target_period": target.target_period,
                    "start_date": target.start_date.isoformat(),
                    "end_date": target.end_date.isoformat(),
                    "description": target.description,
                    "status": target.status,
                    "created_at": target.created_at.isoformat(),
                    "achievement": achievement
                })
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to get all targets: {e}")
            return []
    
    def calculate_target_achievement(self, db: Session, target_id: int) -> Dict[str, Any]:
        """Calculate target achievement for a specific target"""
        try:
            target = db.query(Targets).filter(Targets.id == target_id).first()
            if not target:
                return {"achieved_amount": 0, "achievement_percentage": 0, "status": "not_started"}
            
            # Get sales for the target period
            sales = db.query(Sales).filter(
                and_(
                    Sales.staff_id == target.staff_id,
                    Sales.sale_date >= target.start_date,
                    Sales.sale_date <= target.end_date
                )
            ).all()
            
            achieved_amount = sum(sale.sale_amount for sale in sales)
            achievement_percentage = (achieved_amount / target.target_amount) * 100 if target.target_amount > 0 else 0
            
            # Determine status
            current_date = date.today()
            if current_date < target.start_date:
                status = "not_started"
            elif current_date > target.end_date:
                status = "completed"
            else:
                status = "in_progress"
            
            return {
                "achieved_amount": achieved_amount,
                "achievement_percentage": round(achievement_percentage, 2),
                "status": status,
                "remaining_amount": max(0, target.target_amount - achieved_amount)
            }
            
        except Exception as e:
            logger.error(f"Failed to calculate target achievement: {e}")
            return {"achieved_amount": 0, "achievement_percentage": 0, "status": "error"}
    
    def update_target(self, db: Session, target_id: int, target_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update target information"""
        try:
            target = db.query(Targets).filter(Targets.id == target_id).first()
            if not target:
                return {"success": False, "error": "Target not found"}
            
            # Update fields
            if 'target_amount' in target_data:
                target.target_amount = target_data['target_amount']
            
            if 'target_period' in target_data:
                target.target_period = target_data['target_period']
            
            if 'start_date' in target_data:
                target.start_date = target_data['start_date']
            
            if 'end_date' in target_data:
                target.end_date = target_data['end_date']
            
            if 'description' in target_data:
                target.description = target_data['description']
            
            if 'status' in target_data:
                target.status = target_data['status']
            
            target.updated_at = datetime.now()
            
            db.commit()
            
            return {"success": True, "message": "Target updated successfully"}
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to update target: {e}")
            return {"success": False, "error": str(e)}
    
    def delete_target(self, db: Session, target_id: int) -> Dict[str, Any]:
        """Delete target"""
        try:
            target = db.query(Targets).filter(Targets.id == target_id).first()
            if not target:
                return {"success": False, "error": "Target not found"}
            
            # Check if target is in progress
            current_date = date.today()
            if target.start_date <= current_date <= target.end_date:
                return {"success": False, "error": "Cannot delete target that is currently in progress"}
            
            db.delete(target)
            db.commit()
            
            return {"success": True, "message": "Target deleted successfully"}
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to delete target: {e}")
            return {"success": False, "error": str(e)}
    
    def get_target_performance_report(self, db: Session, period: str = 'monthly') -> List[Dict[str, Any]]:
        """Get target performance report"""
        try:
            # Get targets based on period
            if period == 'monthly':
                current_month = date.today().replace(day=1)
                next_month = (current_month + timedelta(days=32)).replace(day=1)
                targets = db.query(Targets).filter(
                    and_(
                        Targets.target_period == 'monthly',
                        Targets.start_date >= current_month,
                        Targets.start_date < next_month
                    )
                ).all()
            elif period == 'quarterly':
                current_quarter = date.today().replace(day=1)
                targets = db.query(Targets).filter(
                    and_(
                        Targets.target_period == 'quarterly',
                        Targets.start_date >= current_quarter
                    )
                ).all()
            else:
                targets = db.query(Targets).all()
            
            result = []
            for target in targets:
                staff = db.query(Staff).filter(Staff.id == target.staff_id).first()
                achievement = self.calculate_target_achievement(db, target.id)
                
                result.append({
                    "target_id": target.id,
                    "staff_name": staff.name if staff else "Unknown",
                    "target_amount": target.target_amount,
                    "achieved_amount": achievement['achieved_amount'],
                    "achievement_percentage": achievement['achievement_percentage'],
                    "status": achievement['status'],
                    "target_period": target.target_period,
                    "start_date": target.start_date.isoformat(),
                    "end_date": target.end_date.isoformat()
                })
            
            # Sort by achievement percentage
            result.sort(key=lambda x: x['achievement_percentage'], reverse=True)
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to get target performance report: {e}")
            return []
    
    def get_target_statistics(self, db: Session) -> Dict[str, Any]:
        """Get target statistics"""
        try:
            total_targets = db.query(Targets).count()
            active_targets = db.query(Targets).filter(Targets.status == 'active').count()
            completed_targets = db.query(Targets).filter(Targets.status == 'completed').count()
            
            # Calculate average achievement
            targets = db.query(Targets).all()
            achievements = []
            for target in targets:
                achievement = self.calculate_target_achievement(db, target.id)
                achievements.append(achievement['achievement_percentage'])
            
            avg_achievement = sum(achievements) / len(achievements) if achievements else 0
            
            return {
                "total_targets": total_targets,
                "active_targets": active_targets,
                "completed_targets": completed_targets,
                "average_achievement": round(avg_achievement, 2)
            }
            
        except Exception as e:
            logger.error(f"Failed to get target statistics: {e}")
            return {}

# Global target service instance
target_service = TargetService()