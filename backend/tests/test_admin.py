"""
Test admin endpoints
"""
import pytest
from fastapi.testclient import TestClient
from app.models.staff import Staff
from app.models.brands import Brands
from app.models.sales import Sales
from app.models.attendance import Attendance, AttendanceStatus
from app.models.targets import Targets, TargetType
from app.models.advances import Advances, AdvanceStatus, DeductionPlan
from app.models.salary import Salary, PaymentStatus
from datetime import datetime, date, timedelta

def test_get_admin_dashboard(client, db_session, test_admin):
    """Test admin dashboard endpoint"""
    # Login as admin
    login_data = {
        "name": "Test Admin",
        "password": "testpassword"
    }
    
    login_response = client.post("/api/auth/login", json=login_data)
    assert login_response.status_code == 200
    
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test dashboard
    response = client.get("/api/admin/dashboard", headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert "total_staff" in data
    assert "total_sales_today" in data
    assert "total_sales_month" in data
    assert "pending_salaries" in data
    assert "active_advances" in data
    assert "attendance_rate" in data
    assert "system_health" in data

def test_get_staff_list(client, db_session, test_admin, test_staff):
    """Test get staff list"""
    # Login as admin
    login_data = {
        "name": "Test Admin",
        "password": "testpassword"
    }
    
    login_response = client.post("/api/auth/login", json=login_data)
    assert login_response.status_code == 200
    
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test staff list
    response = client.get("/api/admin/staff/list", headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert "staff" in data
    assert len(data["staff"]) >= 1  # At least test_staff should be there

def test_create_staff(client, db_session, test_admin):
    """Test create staff"""
    # Login as admin
    login_data = {
        "name": "Test Admin",
        "password": "testpassword"
    }
    
    login_response = client.post("/api/auth/login", json=login_data)
    assert login_response.status_code == 200
    
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create staff data
    staff_data = {
        "employee_code": "NEW001",
        "name": "New Staff",
        "email": "new@test.com",
        "password": "newpassword",
        "phone": "1234567890",
        "basic_salary": 25000.0,
        "incentive_percentage": 2.5,
        "department": "Sales",
        "joining_date": "2024-01-01"
    }
    
    response = client.post("/api/admin/staff/create", json=staff_data, headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["message"] == "Staff created successfully"
    assert data["staff"]["employee_code"] == "NEW001"
    assert data["staff"]["name"] == "New Staff"

def test_update_staff(client, db_session, test_admin, test_staff):
    """Test update staff"""
    # Login as admin
    login_data = {
        "name": "Test Admin",
        "password": "testpassword"
    }
    
    login_response = client.post("/api/auth/login", json=login_data)
    assert login_response.status_code == 200
    
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Update staff data
    update_data = {
        "name": "Updated Staff",
        "email": "updated@test.com",
        "phone": "9876543210",
        "basic_salary": 35000.0,
        "incentive_percentage": 4.0,
        "department": "Marketing"
    }
    
    response = client.put(f"/api/admin/staff/update/{test_staff.id}", json=update_data, headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["message"] == "Staff updated successfully"

def test_deactivate_staff(client, db_session, test_admin, test_staff):
    """Test deactivate staff"""
    # Login as admin
    login_data = {
        "name": "Test Admin",
        "password": "testpassword"
    }
    
    login_response = client.post("/api/auth/login", json=login_data)
    assert login_response.status_code == 200
    
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Deactivate staff
    response = client.put(f"/api/admin/staff/deactivate/{test_staff.id}", headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["message"] == "Staff deactivated successfully"

def test_get_brands_list(client, db_session, test_admin, test_brand):
    """Test get brands list"""
    # Login as admin
    login_data = {
        "name": "Test Admin",
        "password": "testpassword"
    }
    
    login_response = client.post("/api/auth/login", json=login_data)
    assert login_response.status_code == 200
    
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test brands list
    response = client.get("/api/admin/brands/list", headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert "brands" in data
    assert len(data["brands"]) >= 1  # At least test_brand should be there

def test_create_brand(client, db_session, test_admin):
    """Test create brand"""
    # Login as admin
    login_data = {
        "name": "Test Admin",
        "password": "testpassword"
    }
    
    login_response = client.post("/api/auth/login", json=login_data)
    assert login_response.status_code == 200
    
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create brand data
    brand_data = {
        "brand_name": "New Brand",
        "brand_code": "NB001",
        "description": "A new test brand",
        "category": "Electronics"
    }
    
    response = client.post("/api/admin/brands/create", json=brand_data, headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["message"] == "Brand created successfully"
    assert data["brand"]["brand_name"] == "New Brand"
    assert data["brand"]["brand_code"] == "NB001"

def test_get_sales_list(client, db_session, test_admin, test_sales):
    """Test get sales list"""
    # Login as admin
    login_data = {
        "name": "Test Admin",
        "password": "testpassword"
    }
    
    login_response = client.post("/api/auth/login", json=login_data)
    assert login_response.status_code == 200
    
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test sales list
    response = client.get("/api/admin/sales/list", headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert "sales" in data
    assert len(data["sales"]) >= 1  # At least test_sales should be there

def test_create_sales(client, db_session, test_admin, test_staff, test_brand):
    """Test create sales"""
    # Login as admin
    login_data = {
        "name": "Test Admin",
        "password": "testpassword"
    }
    
    login_response = client.post("/api/auth/login", json=login_data)
    assert login_response.status_code == 200
    
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create sales data
    sales_data = {
        "staff_id": test_staff.id,
        "brand_id": test_brand.id,
        "sale_amount": 2000.0,
        "sale_date": "2024-01-15",
        "units_sold": 10
    }
    
    response = client.post("/api/admin/sales/create", json=sales_data, headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["message"] == "Sales record created successfully"

def test_get_attendance_list(client, db_session, test_admin, test_attendance):
    """Test get attendance list"""
    # Login as admin
    login_data = {
        "name": "Test Admin",
        "password": "testpassword"
    }
    
    login_response = client.post("/api/auth/login", json=login_data)
    assert login_response.status_code == 200
    
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test attendance list
    response = client.get("/api/admin/attendance/list", headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert "attendance" in data
    assert len(data["attendance"]) >= 1  # At least test_attendance should be there

def test_get_targets_list(client, db_session, test_admin, test_target):
    """Test get targets list"""
    # Login as admin
    login_data = {
        "name": "Test Admin",
        "password": "testpassword"
    }
    
    login_response = client.post("/api/auth/login", json=login_data)
    assert login_response.status_code == 200
    
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test targets list
    response = client.get("/api/admin/targets/list", headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert "targets" in data
    assert len(data["targets"]) >= 1  # At least test_target should be there

def test_create_target(client, db_session, test_admin, test_staff):
    """Test create target"""
    # Login as admin
    login_data = {
        "name": "Test Admin",
        "password": "testpassword"
    }
    
    login_response = client.post("/api/auth/login", json=login_data)
    assert login_response.status_code == 200
    
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create target data
    target_data = {
        "staff_id": test_staff.id,
        "target_type": "MONTHLY",
        "total_target_amount": 60000.0,
        "brand_wise_targets": {"Test Brand": 30000.0},
        "period_start": "2024-02-01",
        "period_end": "2024-02-29",
        "incentive_percentage": 6.0
    }
    
    response = client.post("/api/admin/targets/create", json=target_data, headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["message"] == "Target created successfully"

def test_get_advances_list(client, db_session, test_admin, test_advance):
    """Test get advances list"""
    # Login as admin
    login_data = {
        "name": "Test Admin",
        "password": "testpassword"
    }
    
    login_response = client.post("/api/auth/login", json=login_data)
    assert login_response.status_code == 200
    
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test advances list
    response = client.get("/api/admin/advance/list", headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert "advances" in data
    assert len(data["advances"]) >= 1  # At least test_advance should be there

def test_create_advance(client, db_session, test_admin, test_staff):
    """Test create advance"""
    # Login as admin
    login_data = {
        "name": "Test Admin",
        "password": "testpassword"
    }
    
    login_response = client.post("/api/auth/login", json=login_data)
    assert login_response.status_code == 200
    
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create advance data
    advance_data = {
        "staff_id": test_staff.id,
        "advance_amount": 3000.0,
        "reason": "Medical emergency",
        "issue_date": "2024-01-15",
        "deduction_plan": "MONTHLY",
        "monthly_deduction_amount": 500.0
    }
    
    response = client.post("/api/admin/advance/create", json=advance_data, headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["message"] == "Advance created successfully"

def test_get_salary_list(client, db_session, test_admin, test_salary):
    """Test get salary list"""
    # Login as admin
    login_data = {
        "name": "Test Admin",
        "password": "testpassword"
    }
    
    login_response = client.post("/api/auth/login", json=login_data)
    assert login_response.status_code == 200
    
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test salary list
    response = client.get("/api/admin/salary/list", headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert "salaries" in data
    assert len(data["salaries"]) >= 1  # At least test_salary should be there

def test_unauthorized_access(client, db_session, test_staff):
    """Test unauthorized access to admin endpoints"""
    # Login as staff (not admin)
    login_data = {
        "name": "Test Staff",
        "password": "testpassword"
    }
    
    login_response = client.post("/api/auth/login", json=login_data)
    assert login_response.status_code == 200
    
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Try to access admin dashboard
    response = client.get("/api/admin/dashboard", headers=headers)
    assert response.status_code == 403
    assert "Admin access required" in response.json()["detail"]