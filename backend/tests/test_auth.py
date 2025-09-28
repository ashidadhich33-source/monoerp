"""
Authentication tests
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.base import get_db
from app.models.staff import Staff
from sqlalchemy.orm import Session

client = TestClient(app)

def test_login_success(test_db: Session):
    """Test successful login"""
    # Create test staff
    staff = Staff(
        employee_code="EMP001",
        name="Test User",
        email="test@example.com",
        password_hash="$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8Qz8Qz8",  # "password"
        basic_salary=50000,
        incentive_percentage=5,
        is_active=True
    )
    test_db.add(staff)
    test_db.commit()
    
    response = client.post("/api/auth/login", json={
        "employee_code": "EMP001",
        "password": "password"
    })
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_invalid_credentials():
    """Test login with invalid credentials"""
    response = client.post("/api/auth/login", json={
        "employee_code": "INVALID",
        "password": "wrongpassword"
    })
    
    assert response.status_code == 401
    data = response.json()
    assert "detail" in data

def test_verify_network():
    """Test network verification"""
    response = client.get("/api/auth/verify-network")
    
    assert response.status_code == 200
    data = response.json()
    assert "is_local_network" in data
    assert "client_ip" in data

def test_refresh_token(test_db: Session):
    """Test token refresh"""
    # Create test staff
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
    
    # Login first
    login_response = client.post("/api/auth/login", json={
        "employee_code": "EMP001",
        "password": "password"
    })
    
    token = login_response.json()["access_token"]
    
    # Test refresh
    response = client.post("/api/auth/refresh-token", headers={
        "Authorization": f"Bearer {token}"
    })
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data