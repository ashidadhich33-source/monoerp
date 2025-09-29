"""
Test authentication endpoints
"""
import pytest
from fastapi.testclient import TestClient
from app.models.staff import Staff
from app.utils.auth import get_password_hash

def test_register_staff(client, db_session):
    """Test staff registration"""
    staff_data = {
        "employee_code": "TEST001",
        "name": "Test User",
        "email": "test@example.com",
        "password": "testpassword",
        "phone": "1234567890",
        "basic_salary": 30000.0,
        "incentive_percentage": 3.0,
        "department": "Sales",
        "joining_date": "2024-01-01"
    }
    
    response = client.post("/api/auth/register", json=staff_data)
    assert response.status_code == 200
    
    data = response.json()
    assert data["message"] == "Staff registered successfully"
    assert data["employee_code"] == "TEST001"
    assert data["name"] == "Test User"
    assert data["email"] == "test@example.com"

def test_register_duplicate_employee_code(client, db_session, test_staff):
    """Test registration with duplicate employee code"""
    staff_data = {
        "employee_code": "STAFF001",  # Same as test_staff
        "name": "Another User",
        "email": "another@example.com",
        "password": "testpassword",
        "phone": "1234567891",
        "basic_salary": 30000.0,
        "incentive_percentage": 3.0,
        "department": "Sales",
        "joining_date": "2024-01-01"
    }
    
    response = client.post("/api/auth/register", json=staff_data)
    assert response.status_code == 400
    assert "Employee code already exists" in response.json()["detail"]

def test_register_duplicate_email(client, db_session, test_staff):
    """Test registration with duplicate email"""
    staff_data = {
        "employee_code": "TEST002",
        "name": "Another User",
        "email": "staff@test.com",  # Same as test_staff
        "password": "testpassword",
        "phone": "1234567891",
        "basic_salary": 30000.0,
        "incentive_percentage": 3.0,
        "department": "Sales",
        "joining_date": "2024-01-01"
    }
    
    response = client.post("/api/auth/register", json=staff_data)
    assert response.status_code == 400
    assert "Email already exists" in response.json()["detail"]

def test_login_success(client, db_session, test_staff):
    """Test successful login"""
    login_data = {
        "name": "Test Staff",
        "password": "testpassword"
    }
    
    response = client.post("/api/auth/login", json=login_data)
    assert response.status_code == 200
    
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["staff_id"] == test_staff.id
    assert data["name"] == "Test Staff"
    assert data["employee_code"] == "STAFF001"
    assert data["is_admin"] == False

def test_login_invalid_credentials(client, db_session):
    """Test login with invalid credentials"""
    login_data = {
        "name": "NonExistentUser",
        "password": "wrongpassword"
    }
    
    response = client.post("/api/auth/login", json=login_data)
    assert response.status_code == 401
    assert "Incorrect name or password" in response.json()["detail"]

def test_login_inactive_staff(client, db_session):
    """Test login with inactive staff"""
    # Create inactive staff
    inactive_staff = Staff(
        employee_code="INACTIVE001",
        name="Inactive Staff",
        email="inactive@test.com",
        password_hash=get_password_hash("testpassword"),
        phone="1234567890",
        basic_salary=30000.0,
        incentive_percentage=3.0,
        department="Sales",
        joining_date=date.today(),
        is_active=False,
        is_admin=False
    )
    db_session.add(inactive_staff)
    db_session.commit()
    
    login_data = {
        "name": "Inactive Staff",
        "password": "testpassword"
    }
    
    response = client.post("/api/auth/login", json=login_data)
    assert response.status_code == 401
    assert "Incorrect name or password" in response.json()["detail"]

def test_logout(client):
    """Test logout"""
    response = client.post("/api/auth/logout")
    assert response.status_code == 200
    assert response.json()["message"] == "Successfully logged out"

def test_refresh_token(client, db_session, test_staff):
    """Test token refresh"""
    # First login to get token
    login_data = {
        "name": "Test Staff",
        "password": "testpassword"
    }
    
    login_response = client.post("/api/auth/login", json=login_data)
    assert login_response.status_code == 200
    
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test refresh token
    response = client.post("/api/auth/refresh-token", headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["access_token"] != token  # Should be a new token

def test_verify_network(client):
    """Test network verification"""
    response = client.get("/api/auth/verify-network")
    assert response.status_code == 200
    
    data = response.json()
    assert "is_local_network" in data
    assert "client_ip" in data
    assert "message" in data