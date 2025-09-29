# API Documentation

## Base URL
```
http://localhost:8000
```

## Authentication

All API endpoints (except setup and login) require authentication using JWT tokens.

### Headers
```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

## Setup Endpoints

### Check Setup Status
```http
GET /api/setup/status
```

**Response:**
```json
{
  "is_setup_complete": false,
  "message": "System setup not completed",
  "company": null,
  "admin": null
}
```

### Complete Setup
```http
POST /api/setup/complete
```

**Request Body:**
```json
{
  "company_data": {
    "name": "Company Name",
    "address": "Company Address",
    "phone": "+1234567890",
    "industry_type": "Technology",
    "timezone": "UTC",
    "currency": "USD",
    "working_hours_start": "09:00",
    "working_hours_end": "17:00"
  },
  "admin_data": {
    "name": "Admin Name",
    "email": "admin@company.com",
    "password": "securepassword",
    "phone": "+1234567890"
  },
  "system_config": {}
}
```

## Authentication Endpoints

### Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "name": "Staff Name",
  "password": "password",
  "mac_address": "AA:BB:CC:DD:EE:FF"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "staff_id": 1,
  "name": "Staff Name",
  "employee_code": "EMP001",
  "is_admin": false
}
```

### Logout
```http
POST /api/auth/logout
```

### Refresh Token
```http
POST /api/auth/refresh-token
```

**Response:**
```json
{
  "access_token": "new-jwt-token",
  "token_type": "bearer"
}
```

### Register Staff
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "employee_code": "EMP002",
  "name": "New Staff",
  "email": "staff@company.com",
  "password": "password",
  "phone": "+1234567890",
  "basic_salary": 30000.0,
  "incentive_percentage": 3.0,
  "department": "Sales",
  "joining_date": "2024-01-01"
}
```

## Admin Endpoints

### Dashboard
```http
GET /api/admin/dashboard
```

**Response:**
```json
{
  "total_staff": 25,
  "total_sales_today": 15000.0,
  "total_sales_month": 450000.0,
  "pending_salaries": 5,
  "active_advances": 3,
  "attendance_rate": 95.5,
  "system_health": "OK"
}
```

### Staff Management

#### Get Staff List
```http
GET /api/admin/staff/list
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term
- `department` (optional): Filter by department
- `is_active` (optional): Filter by active status

**Response:**
```json
{
  "staff": [
    {
      "id": 1,
      "employee_code": "EMP001",
      "name": "John Doe",
      "email": "john@company.com",
      "phone": "+1234567890",
      "basic_salary": 30000.0,
      "incentive_percentage": 3.0,
      "department": "Sales",
      "joining_date": "2024-01-01",
      "is_active": true,
      "is_admin": false
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10
}
```

#### Create Staff
```http
POST /api/admin/staff/create
```

**Request Body:**
```json
{
  "employee_code": "EMP003",
  "name": "Jane Smith",
  "email": "jane@company.com",
  "password": "password",
  "phone": "+1234567891",
  "basic_salary": 35000.0,
  "incentive_percentage": 4.0,
  "department": "Marketing",
  "joining_date": "2024-02-01"
}
```

#### Update Staff
```http
PUT /api/admin/staff/update/{staff_id}
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "email": "updated@company.com",
  "phone": "+1234567892",
  "basic_salary": 40000.0,
  "incentive_percentage": 5.0,
  "department": "Sales",
  "is_active": true
}
```

#### Deactivate Staff
```http
PUT /api/admin/staff/deactivate/{staff_id}
```

### Sales Management

#### Get Sales List
```http
GET /api/admin/sales/list
```

**Query Parameters:**
- `start_date` (optional): Start date (YYYY-MM-DD)
- `end_date` (optional): End date (YYYY-MM-DD)
- `staff_id` (optional): Filter by staff member
- `brand_id` (optional): Filter by brand

#### Create Sales Record
```http
POST /api/admin/sales/create
```

**Request Body:**
```json
{
  "staff_id": 1,
  "brand_id": 1,
  "sale_amount": 1000.0,
  "sale_date": "2024-01-15",
  "units_sold": 5
}
```

#### Bulk Upload Sales
```http
POST /api/admin/sales/bulk-upload
```

**Request:** Multipart form data with Excel file

### Attendance Management

#### Get Attendance List
```http
GET /api/admin/attendance/list
```

**Query Parameters:**
- `start_date` (optional): Start date (YYYY-MM-DD)
- `end_date` (optional): End date (YYYY-MM-DD)
- `staff_id` (optional): Filter by staff member
- `status` (optional): Filter by status (present, absent, late)

### Target Management

#### Get Targets List
```http
GET /api/admin/targets/list
```

#### Create Target
```http
POST /api/admin/targets/create
```

**Request Body:**
```json
{
  "staff_id": 1,
  "target_type": "MONTHLY",
  "total_target_amount": 50000.0,
  "brand_wise_targets": {
    "Brand A": 25000.0,
    "Brand B": 25000.0
  },
  "period_start": "2024-01-01",
  "period_end": "2024-01-31",
  "incentive_percentage": 5.0
}
```

### Advance Management

#### Get Advances List
```http
GET /api/admin/advance/list
```

#### Create Advance
```http
POST /api/admin/advance/create
```

**Request Body:**
```json
{
  "staff_id": 1,
  "advance_amount": 5000.0,
  "reason": "Medical emergency",
  "issue_date": "2024-01-15",
  "deduction_plan": "MONTHLY",
  "monthly_deduction_amount": 1000.0
}
```

### Salary Management

#### Get Salary List
```http
GET /api/admin/salary/list
```

**Query Parameters:**
- `month_year` (optional): Filter by month (YYYY-MM)
- `staff_id` (optional): Filter by staff member
- `payment_status` (optional): Filter by payment status

#### Calculate Salary
```http
POST /api/admin/salary/calculate
```

**Request Body:**
```json
{
  "month_year": "2024-01",
  "staff_ids": [1, 2, 3]
}
```

### Brand Management

#### Get Brands List
```http
GET /api/admin/brands/list
```

#### Create Brand
```http
POST /api/admin/brands/create
```

**Request Body:**
```json
{
  "brand_name": "Brand Name",
  "brand_code": "BN001",
  "description": "Brand description",
  "category": "Electronics"
}
```

### Reports and Exports

#### Export Sales CSV
```http
GET /api/admin/reports/sales/export/csv
```

**Query Parameters:**
- `start_date` (optional): Start date (YYYY-MM-DD)
- `end_date` (optional): End date (YYYY-MM-DD)

#### Export Sales PDF
```http
GET /api/admin/reports/sales/export/pdf
```

#### Export Attendance CSV
```http
GET /api/admin/reports/attendance/export/csv
```

#### Export Attendance PDF
```http
GET /api/admin/reports/attendance/export/pdf
```

#### Generate Salary Slip PDF
```http
GET /api/admin/salary/slip/{staff_id}/{month_year}/pdf
```

### Notifications

#### Get Notifications
```http
GET /api/admin/notifications
```

**Query Parameters:**
- `limit` (optional): Number of notifications (default: 50)
- `offset` (optional): Offset for pagination (default: 0)
- `unread_only` (optional): Filter unread notifications (true/false)

#### Mark Notification as Read
```http
PUT /api/admin/notifications/{notification_id}/read
```

#### Mark All Notifications as Read
```http
PUT /api/admin/notifications/read-all
```

#### Get Notification Statistics
```http
GET /api/admin/notifications/statistics
```

#### Send Attendance Reminder
```http
POST /api/admin/notifications/send-attendance-reminder/{staff_id}
```

#### Send System Alert
```http
POST /api/admin/notifications/send-system-alert
```

**Request Body:**
```json
{
  "message": "System maintenance scheduled",
  "alert_type": "system"
}
```

### Templates

#### Download Sales Template
```http
GET /api/admin/sales/template
```

#### Download Attendance Template
```http
GET /api/admin/attendance/template
```

## Staff Endpoints

### Dashboard
```http
GET /api/staff/dashboard/{staff_id}
```

**Response:**
```json
{
  "today_attendance": {
    "id": 1,
    "check_in_time": "2024-01-15T09:00:00",
    "check_out_time": "2024-01-15T17:00:00",
    "date": "2024-01-15",
    "status": "present",
    "created_at": "2024-01-15T09:00:00"
  },
  "personal_sales_today": 1500.0,
  "personal_sales_month": 45000.0,
  "current_target": {
    "id": 1,
    "target_type": "MONTHLY",
    "total_target_amount": 50000.0,
    "period_start": "2024-01-01",
    "period_end": "2024-01-31",
    "incentive_percentage": 5.0
  },
  "achievement_percentage": 90.0,
  "quick_stats": {
    "total_sales": 45000.0,
    "target_achieved": 90.0,
    "incentive_earned": 2250.0
  }
}
```

### Attendance

#### Check In
```http
POST /api/staff/attendance/check-in
```

**Request Body:**
```json
{
  "mac_address": "AA:BB:CC:DD:EE:FF"
}
```

#### Check Out
```http
POST /api/staff/attendance/check-out
```

#### Get Attendance History
```http
GET /api/staff/attendance/history
```

**Query Parameters:**
- `start_date` (optional): Start date (YYYY-MM-DD)
- `end_date` (optional): End date (YYYY-MM-DD)

### Sales

#### Get Personal Sales
```http
GET /api/staff/sales/list
```

**Query Parameters:**
- `start_date` (optional): Start date (YYYY-MM-DD)
- `end_date` (optional): End date (YYYY-MM-DD)

#### Create Sales Record
```http
POST /api/staff/sales/create
```

**Request Body:**
```json
{
  "brand_id": 1,
  "sale_amount": 1000.0,
  "sale_date": "2024-01-15",
  "units_sold": 5
}
```

### Rankings

#### Get Rankings
```http
GET /api/staff/rankings/{period_type}
```

**Path Parameters:**
- `period_type`: DAILY, WEEKLY, MONTHLY, YEARLY

### Salary

#### Get Salary Details
```http
GET /api/staff/salary/details/{month_year}
```

**Response:**
```json
{
  "month_year": "2024-01",
  "basic_salary": 30000.0,
  "working_days": 22,
  "present_days": 20,
  "sunday_count": 4,
  "salary_for_days": 27272.73,
  "target_incentive": 0.0,
  "basic_incentive": 0.0,
  "gross_salary": 27272.73,
  "advance_deduction": 1000.0,
  "net_salary": 26272.73,
  "payment_status": "pending",
  "payment_date": null
}
```

### Targets

#### Get Current Targets
```http
GET /api/staff/targets/current
```

### Achievements

#### Get Achievements
```http
GET /api/staff/achievements
```

## Error Responses

### Standard Error Format
```json
{
  "detail": "Error message description"
}
```

### Common HTTP Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Access denied
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation error
- `500 Internal Server Error`: Server error

### Error Examples

#### Validation Error
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

#### Authentication Error
```json
{
  "detail": "Could not validate credentials"
}
```

#### Access Denied Error
```json
{
  "detail": "Admin access required"
}
```

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- **Authentication endpoints**: 5 requests per minute
- **Data modification endpoints**: 10 requests per minute
- **Data retrieval endpoints**: 30 requests per minute

## Pagination

List endpoints support pagination:

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

**Response Format:**
```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 10,
  "pages": 10
}
```

## Filtering and Sorting

Many list endpoints support filtering and sorting:

**Query Parameters:**
- `search`: Search term
- `sort_by`: Field to sort by
- `sort_order`: asc or desc
- `filter_field`: Filter by specific field

## File Uploads

File upload endpoints accept multipart form data:

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `file`: The file to upload
- Additional metadata fields as needed

## WebSocket Support

Real-time notifications are available via WebSocket:

**Connection URL:** `ws://localhost:8000/ws`

**Message Format:**
```json
{
  "type": "notification",
  "data": {
    "id": 1,
    "title": "New Notification",
    "message": "Notification message",
    "timestamp": "2024-01-15T10:00:00Z"
  }
}
```

## SDK and Libraries

### Python
```python
import requests

# Set up authentication
headers = {
    'Authorization': 'Bearer your-jwt-token',
    'Content-Type': 'application/json'
}

# Make API request
response = requests.get('http://localhost:8000/api/admin/dashboard', headers=headers)
data = response.json()
```

### JavaScript
```javascript
const axios = require('axios');

// Set up authentication
const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Authorization': 'Bearer your-jwt-token',
    'Content-Type': 'application/json'
  }
});

// Make API request
const response = await api.get('/api/admin/dashboard');
const data = response.data;
```

## Testing

### Test Data
Use the following test credentials for development:

**Admin User:**
- Name: `admin`
- Password: `admin123`

**Staff User:**
- Name: `staff`
- Password: `staff123`

### Postman Collection
A Postman collection is available for testing all endpoints. Import the collection and set up environment variables for easy testing.

## Support

For API support and questions:
- Check the error messages for detailed information
- Review the request/response examples
- Contact the development team for assistance