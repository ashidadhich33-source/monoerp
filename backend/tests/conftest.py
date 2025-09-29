"""
Test configuration and fixtures
"""
import pytest
import os
import tempfile
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from app.main import app
from app.models.base import Base, get_db
from app.models.staff import Staff
from app.models.brands import Brands
from app.models.attendance import Attendance, AttendanceStatus
from app.models.sales import Sales
from app.models.targets import Targets, TargetType
from app.models.achievements import Achievements
from app.models.salary import Salary, PaymentStatus
from app.models.advances import Advances, AdvanceStatus, DeductionPlan
from app.models.rankings import Rankings, PeriodType
from app.models.notifications import Notification
from app.utils.auth import get_password_hash
from datetime import datetime, date, timedelta

# Test database URL
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

# Create test engine
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session")
def db_engine():
    """Create test database engine"""
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db_session(db_engine):
    """Create test database session"""
    connection = db_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="function")
def client(db_session):
    """Create test client"""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()

@pytest.fixture
def test_admin(db_session):
    """Create test admin user"""
    admin = Staff(
        employee_code="ADMIN001",
        name="Test Admin",
        email="admin@test.com",
        password_hash=get_password_hash("testpassword"),
        phone="1234567890",
        basic_salary=50000.0,
        incentive_percentage=5.0,
        department="Management",
        joining_date=date.today(),
        is_active=True,
        is_admin=True
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    return admin

@pytest.fixture
def test_staff(db_session):
    """Create test staff user"""
    staff = Staff(
        employee_code="STAFF001",
        name="Test Staff",
        email="staff@test.com",
        password_hash=get_password_hash("testpassword"),
        phone="1234567891",
        basic_salary=30000.0,
        incentive_percentage=3.0,
        department="Sales",
        joining_date=date.today(),
        is_active=True,
        is_admin=False
    )
    db_session.add(staff)
    db_session.commit()
    db_session.refresh(staff)
    return staff

@pytest.fixture
def test_brand(db_session):
    """Create test brand"""
    brand = Brands(
        brand_name="Test Brand",
        brand_code="TB001",
        description="Test brand for testing",
        category="Electronics",
        is_active=True
    )
    db_session.add(brand)
    db_session.commit()
    db_session.refresh(brand)
    return brand

@pytest.fixture
def test_attendance(db_session, test_staff):
    """Create test attendance record"""
    attendance = Attendance(
        staff_id=test_staff.id,
        date=date.today(),
        check_in_time=datetime.now().replace(hour=9, minute=0, second=0, microsecond=0),
        check_out_time=datetime.now().replace(hour=17, minute=0, second=0, microsecond=0),
        status=AttendanceStatus.PRESENT,
        created_at=datetime.now()
    )
    db_session.add(attendance)
    db_session.commit()
    db_session.refresh(attendance)
    return attendance

@pytest.fixture
def test_sales(db_session, test_staff, test_brand):
    """Create test sales record"""
    sales = Sales(
        staff_id=test_staff.id,
        brand_id=test_brand.id,
        sale_amount=1000.0,
        sale_date=date.today(),
        units_sold=5,
        created_at=datetime.now()
    )
    db_session.add(sales)
    db_session.commit()
    db_session.refresh(sales)
    return sales

@pytest.fixture
def test_target(db_session, test_staff):
    """Create test target"""
    target = Targets(
        staff_id=test_staff.id,
        target_type=TargetType.MONTHLY,
        total_target_amount=50000.0,
        brand_wise_targets={"Test Brand": 25000.0},
        period_start=date.today().replace(day=1),
        period_end=date.today().replace(day=28),
        incentive_percentage=5.0,
        created_at=datetime.now()
    )
    db_session.add(target)
    db_session.commit()
    db_session.refresh(target)
    return target

@pytest.fixture
def test_advance(db_session, test_staff):
    """Create test advance"""
    advance = Advances(
        staff_id=test_staff.id,
        advance_amount=5000.0,
        reason="Emergency",
        issue_date=date.today(),
        deduction_plan=DeductionPlan.MONTHLY,
        monthly_deduction_amount=1000.0,
        status=AdvanceStatus.ACTIVE,
        created_at=datetime.now()
    )
    db_session.add(advance)
    db_session.commit()
    db_session.refresh(advance)
    return advance

@pytest.fixture
def test_salary(db_session, test_staff):
    """Create test salary record"""
    salary = Salary(
        staff_id=test_staff.id,
        month_year="2024-01",
        basic_salary=30000.0,
        working_days=22,
        present_days=20,
        sunday_count=4,
        salary_for_days=27272.73,
        target_incentive=0.0,
        basic_incentive=0.0,
        gross_salary=27272.73,
        advance_deduction=1000.0,
        net_salary=26272.73,
        payment_status=PaymentStatus.PENDING,
        created_at=datetime.now()
    )
    db_session.add(salary)
    db_session.commit()
    db_session.refresh(salary)
    return salary

@pytest.fixture
def test_notification(db_session, test_staff):
    """Create test notification"""
    notification = Notification(
        user_id=test_staff.id,
        title="Test Notification",
        message="This is a test notification",
        notification_type="info",
        priority="normal",
        data={},
        is_read=False,
        created_at=datetime.now()
    )
    db_session.add(notification)
    db_session.commit()
    db_session.refresh(notification)
    return notification