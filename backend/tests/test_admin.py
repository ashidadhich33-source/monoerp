"""
Admin panel tests
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.base import get_db
from app.models.staff import Staff
from app.models.brands import Brands
from app.models.sales import Sales
from sqlalchemy.orm import Session
from datetime import datetime, date

client = TestClient(app)

@pytest.fixture
def admin_staff(test_db: Session):
    """Create admin staff member"""
    staff = Staff(
        employee_code="ADMIN001",
        name="Admin User",
        email="admin@example.com",
        password_hash="$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8Qz8Qz8",
        basic_salary=100000,
        incentive_percentage=10,
        is_active=True,
        is_admin=True
    )
    test_db.add(staff)
    test_db.commit()
    return staff

@pytest.fixture
def admin_headers(admin_staff):
    """Get admin authentication headers"""
    response = client.post("/api/auth/login", json={
        "employee_code": "ADMIN001",
        "password": "password"
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_admin_dashboard(admin_headers):
    """Test admin dashboard"""
    response = client.get("/api/admin/dashboard", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_staff" in data
    assert "total_sales" in data

def test_create_staff(admin_headers, test_db: Session):
    """Test creating new staff"""
    staff_data = {
        "employee_code": "EMP002",
        "name": "New Staff",
        "email": "newstaff@example.com",
        "password": "password123",
        "basic_salary": 40000,
        "incentive_percentage": 5,
        "department": "Sales"
    }
    
    response = client.post("/api/admin/staff", json=staff_data, headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    
    # Verify staff was created
    staff = test_db.query(Staff).filter(Staff.employee_code == "EMP002").first()
    assert staff is not None
    assert staff.name == "New Staff"

def test_get_staff_list(admin_headers):
    """Test getting staff list"""
    response = client.get("/api/admin/staff", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_create_brand(admin_headers, test_db: Session):
    """Test creating new brand"""
    brand_data = {
        "brand_name": "Test Brand",
        "description": "Test brand description",
        "category": "Electronics"
    }
    
    response = client.post("/api/admin/brands", json=brand_data, headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    
    # Verify brand was created
    brand = test_db.query(Brands).filter(Brands.brand_name == "Test Brand").first()
    assert brand is not None

def test_create_sales_record(admin_headers, test_db: Session):
    """Test creating sales record"""
    # Create staff and brand first
    staff = Staff(
        employee_code="EMP003",
        name="Sales Staff",
        email="sales@example.com",
        password_hash="$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8Qz8Qz8",
        basic_salary=45000,
        incentive_percentage=7,
        is_active=True
    )
    test_db.add(staff)
    
    brand = Brands(brand_name="Test Brand 2")
    test_db.add(brand)
    test_db.commit()
    
    sales_data = {
        "staff_id": staff.id,
        "brand_id": brand.id,
        "sale_amount": 15000,
        "sale_date": "2024-01-15",
        "units_sold": 3
    }
    
    response = client.post("/api/admin/sales", json=sales_data, headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    
    # Verify sales record was created
    sales = test_db.query(Sales).filter(Sales.staff_id == staff.id).first()
    assert sales is not None
    assert sales.sale_amount == 15000

def test_get_sales_list(admin_headers):
    """Test getting sales list"""
    response = client.get("/api/admin/sales", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_get_backup_status(admin_headers):
    """Test getting backup status"""
    response = client.get("/api/admin/backup/status", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert "last_backup" in data

def test_create_backup(admin_headers):
    """Test creating backup"""
    response = client.post("/api/admin/backup/create", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert "message" in data