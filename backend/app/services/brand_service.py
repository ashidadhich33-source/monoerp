"""
Brand management service for handling product brands
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from app.models.brands import Brands
from app.models.sales import Sales
import logging

logger = logging.getLogger(__name__)

class BrandService:
    def __init__(self):
        pass
    
    def create_brand(self, db: Session, brand_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new brand"""
        try:
            # Check if brand already exists
            existing_brand = db.query(Brands).filter(
                Brands.brand_name == brand_data['brand_name']
            ).first()
            
            if existing_brand:
                return {"success": False, "error": "Brand already exists"}
            
            # Create brand
            brand = Brands(
                brand_name=brand_data['brand_name'],
                description=brand_data.get('description', ''),
                category=brand_data.get('category', ''),
                is_active=brand_data.get('is_active', True),
                created_at=datetime.now()
            )
            
            db.add(brand)
            db.commit()
            
            return {
                "success": True,
                "brand_id": brand.id,
                "message": "Brand created successfully"
            }
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to create brand: {e}")
            return {"success": False, "error": str(e)}
    
    def get_all_brands(self, db: Session, active_only: bool = True) -> List[Dict[str, Any]]:
        """Get all brands"""
        try:
            query = db.query(Brands)
            if active_only:
                query = query.filter(Brands.is_active == True)
            
            brands = query.order_by(Brands.brand_name).all()
            
            return [
                {
                    "id": brand.id,
                    "brand_name": brand.brand_name,
                    "description": brand.description,
                    "category": brand.category,
                    "is_active": brand.is_active,
                    "created_at": brand.created_at.isoformat(),
                    "total_sales": self.get_brand_sales_total(db, brand.id),
                    "sales_count": self.get_brand_sales_count(db, brand.id)
                }
                for brand in brands
            ]
            
        except Exception as e:
            logger.error(f"Failed to get brands: {e}")
            return []
    
    def get_brand_by_id(self, db: Session, brand_id: int) -> Optional[Dict[str, Any]]:
        """Get brand by ID"""
        try:
            brand = db.query(Brands).filter(Brands.id == brand_id).first()
            if not brand:
                return None
            
            return {
                "id": brand.id,
                "brand_name": brand.brand_name,
                "description": brand.description,
                "category": brand.category,
                "is_active": brand.is_active,
                "created_at": brand.created_at.isoformat(),
                "total_sales": self.get_brand_sales_total(db, brand.id),
                "sales_count": self.get_brand_sales_count(db, brand.id)
            }
            
        except Exception as e:
            logger.error(f"Failed to get brand: {e}")
            return None
    
    def update_brand(self, db: Session, brand_id: int, brand_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update brand information"""
        try:
            brand = db.query(Brands).filter(Brands.id == brand_id).first()
            if not brand:
                return {"success": False, "error": "Brand not found"}
            
            # Update fields
            if 'brand_name' in brand_data:
                # Check if new name conflicts with existing brands
                existing = db.query(Brands).filter(
                    and_(Brands.brand_name == brand_data['brand_name'], Brands.id != brand_id)
                ).first()
                if existing:
                    return {"success": False, "error": "Brand name already exists"}
                brand.brand_name = brand_data['brand_name']
            
            if 'description' in brand_data:
                brand.description = brand_data['description']
            
            if 'category' in brand_data:
                brand.category = brand_data['category']
            
            if 'is_active' in brand_data:
                brand.is_active = brand_data['is_active']
            
            brand.updated_at = datetime.now()
            
            db.commit()
            
            return {"success": True, "message": "Brand updated successfully"}
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to update brand: {e}")
            return {"success": False, "error": str(e)}
    
    def delete_brand(self, db: Session, brand_id: int) -> Dict[str, Any]:
        """Delete brand (soft delete by setting is_active to False)"""
        try:
            brand = db.query(Brands).filter(Brands.id == brand_id).first()
            if not brand:
                return {"success": False, "error": "Brand not found"}
            
            # Check if brand has sales records
            sales_count = db.query(Sales).filter(Sales.brand_id == brand_id).count()
            if sales_count > 0:
                return {"success": False, "error": "Cannot delete brand with existing sales records"}
            
            # Soft delete
            brand.is_active = False
            brand.updated_at = datetime.now()
            
            db.commit()
            
            return {"success": True, "message": "Brand deleted successfully"}
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to delete brand: {e}")
            return {"success": False, "error": str(e)}
    
    def get_brand_sales_total(self, db: Session, brand_id: int) -> float:
        """Get total sales amount for a brand"""
        try:
            result = db.query(func.sum(Sales.sale_amount)).filter(
                Sales.brand_id == brand_id
            ).scalar()
            return float(result) if result else 0.0
        except Exception as e:
            logger.error(f"Failed to get brand sales total: {e}")
            return 0.0
    
    def get_brand_sales_count(self, db: Session, brand_id: int) -> int:
        """Get total number of sales for a brand"""
        try:
            return db.query(Sales).filter(Sales.brand_id == brand_id).count()
        except Exception as e:
            logger.error(f"Failed to get brand sales count: {e}")
            return 0
    
    def get_brand_sales_by_period(self, db: Session, brand_id: int, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        """Get brand sales for a specific period"""
        try:
            from datetime import datetime
            start_dt = datetime.fromisoformat(start_date)
            end_dt = datetime.fromisoformat(end_date)
            
            sales = db.query(Sales).filter(
                and_(
                    Sales.brand_id == brand_id,
                    Sales.sale_date >= start_dt.date(),
                    Sales.sale_date <= end_dt.date()
                )
            ).order_by(desc(Sales.sale_date)).all()
            
            return [
                {
                    "id": sale.id,
                    "sale_amount": sale.sale_amount,
                    "sale_date": sale.sale_date.isoformat(),
                    "units_sold": sale.units_sold,
                    "staff_name": sale.staff.name if sale.staff else "Unknown"
                }
                for sale in sales
            ]
            
        except Exception as e:
            logger.error(f"Failed to get brand sales by period: {e}")
            return []
    
    def get_brand_performance(self, db: Session, brand_id: int) -> Dict[str, Any]:
        """Get brand performance metrics"""
        try:
            # Total sales
            total_sales = self.get_brand_sales_total(db, brand_id)
            
            # Sales count
            sales_count = self.get_brand_sales_count(db, brand_id)
            
            # Average sale amount
            avg_sale = total_sales / sales_count if sales_count > 0 else 0
            
            # Top performing staff for this brand
            from app.models.staff import Staff
            top_staff = db.query(
                Staff.name,
                func.sum(Sales.sale_amount).label('total_sales')
            ).join(Sales).filter(
                Sales.brand_id == brand_id
            ).group_by(Staff.id, Staff.name).order_by(
                desc('total_sales')
            ).limit(5).all()
            
            return {
                "total_sales": total_sales,
                "sales_count": sales_count,
                "average_sale": avg_sale,
                "top_performers": [
                    {"name": staff[0], "total_sales": float(staff[1])}
                    for staff in top_staff
                ]
            }
            
        except Exception as e:
            logger.error(f"Failed to get brand performance: {e}")
            return {}
    
    def get_brand_statistics(self, db: Session) -> Dict[str, Any]:
        """Get overall brand statistics"""
        try:
            total_brands = db.query(Brands).count()
            active_brands = db.query(Brands).filter(Brands.is_active == True).count()
            
            # Top selling brands
            top_brands = db.query(
                Brands.brand_name,
                func.sum(Sales.sale_amount).label('total_sales')
            ).join(Sales).group_by(
                Brands.id, Brands.brand_name
            ).order_by(desc('total_sales')).limit(10).all()
            
            return {
                "total_brands": total_brands,
                "active_brands": active_brands,
                "top_brands": [
                    {"brand_name": brand[0], "total_sales": float(brand[1])}
                    for brand in top_brands
                ]
            }
            
        except Exception as e:
            logger.error(f"Failed to get brand statistics: {e}")
            return {}

# Global brand service instance
brand_service = BrandService()