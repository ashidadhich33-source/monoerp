"""
Staff panel tests
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.base import get_db
from app.models.staff import Staff
from app.models.attendance import Attendance
from app.models.sales import Sales
from sqlalchemy.orm import Session
from datetime import datetime, date

client = TestClient(app)

@pytest.fixture
def test_staff(test_db: Session):
    """Create test staff member"""
    staff = Staff(
        employee_code="EMP001",
        name="Test User",
        email="test@example.com",
        password_hash="$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8Qz8Qz8",
        basic_salary=50000,
        incentive_percentage=5,
        is_active=True
    )
    test_db.add(staff)
    test_db.commit()
    return staff

@pytest.fixture
def auth_headers(test_staff):
    """Get authentication headers"""
    response = client.post("/api/auth/login", json={
        "employee_code": "EMP001",
        "password": "password"
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_staff_dashboard(auth_headers):
    """Test staff dashboard"""
    response = client.get("/api/staff/dashboard", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "today_attendance" in data
    assert "personal_sales_today" in data

def test_check_in(auth_headers, test_staff, test_db: Session):
    """Test check-in functionality"""
    response = client.post("/api/staff/check-in", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    
    # Verify attendance record was created
    attendance = test_db.query(Attendance).filter(
        Attendance.staff_id == test_staff.id
    ).first()
    assert attendance is not None
    assert attendance.check_in_time is not None

def test_check_out(auth_headers, test_staff, test_db: Session):
    """Test check-out functionality"""
    # First check in
    client.post("/api/staff/check-in", headers=auth_headers)
    
    # Then check out
    response = client.post("/api/staff/check-out", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    
    # Verify attendance record was updated
    attendance = test_db.query(Attendance).filter(
        Attendance.staff_id == test_staff.id
    ).first()
    assert attendance.check_out_time is not None

def test_get_attendance_history(auth_headers):
    """Test getting attendance history"""
    response = client.get("/api/staff/attendance", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_get_personal_sales(auth_headers):
    """Test getting personal sales"""
    response = client.get("/api/staff/sales", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_get_rankings(auth_headers):
    """Test getting rankings"""
    response = client.get("/api/staff/rankings?period=monthly", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_get_salary_details(auth_headers):
    """Test getting salary details"""
    response = client.get("/api/staff/salary?month=2024-01", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "month_year" in data or "error" in data