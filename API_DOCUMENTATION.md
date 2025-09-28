# Staff Attendance & Payout System - API Documentation

## Overview

This document provides comprehensive API documentation for the Staff Attendance & Payout System. The API is built with FastAPI and provides RESTful endpoints for staff management, attendance tracking, sales management, and administrative functions.

## Base URL

```
http://localhost:8000/api
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": { ... }
}
```

## Authentication Endpoints

### POST /auth/login
Login with employee credentials.

**Request Body:**
```json
{
  "employee_code": "EMP001",
  "password": "password123"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 28800
}
```

### POST /auth/refresh-token
Refresh JWT token.

**Headers:**
```
Authorization: Bearer <current-token>
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer"
}
```

### GET /auth/verify-network
Verify if request is from local network.

**Response:**
```json
{
  "is_local_network": true,
  "client_ip": "192.168.1.100",
  "message": "Local network access verified"
}
```

## Staff Endpoints

### GET /staff/dashboard
Get staff dashboard data.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "today_attendance": {
    "status": "present",
    "check_in_time": "09:00:00",
    "check_out_time": null
  },
  "personal_sales_today": 15000,
  "personal_sales_month": 450000,
  "target_achievement": 85.5,
  "rank_position": 3,
  "total_staff": 25
}
```

### POST /staff/check-in
Check in for attendance.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "wifi_mac_address": "AA:BB:CC:DD:EE:FF",
  "location": "Office"
}
```

**Response:**
```json
{
  "message": "Successfully checked in",
  "check_in_time": "2024-01-15T09:00:00",
  "status": "present"
}
```

### POST /staff/check-out
Check out for attendance.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Successfully checked out",
  "check_out_time": "2024-01-15T18:00:00",
  "working_hours": 9.0
}
```

### GET /staff/attendance
Get attendance history.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `start_date` (optional): Start date (YYYY-MM-DD)
- `end_date` (optional): End date (YYYY-MM-DD)
- `limit` (optional): Number of records (default: 50)

**Response:**
```json
[
  {
    "id": 1,
    "date": "2024-01-15",
    "check_in_time": "09:00:00",
    "check_out_time": "18:00:00",
    "status": "present",
    "working_hours": 9.0
  }
]
```

### GET /staff/sales
Get personal sales data.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `start_date` (optional): Start date (YYYY-MM-DD)
- `end_date` (optional): End date (YYYY-MM-DD)
- `brand_id` (optional): Filter by brand

**Response:**
```json
[
  {
    "id": 1,
    "brand_name": "Brand A",
    "sale_amount": 15000,
    "sale_date": "2024-01-15",
    "units_sold": 3
  }
]
```

### GET /staff/rankings
Get performance rankings.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `period` (optional): monthly, quarterly, yearly (default: monthly)

**Response:**
```json
{
  "rankings": [
    {
      "rank": 1,
      "staff_name": "John Doe",
      "total_sales": 500000,
      "target_achievement": 120.5
    }
  ],
  "personal_rank": 3,
  "personal_highlights": {
    "best_month": "January 2024",
    "best_sales": 75000
  }
}
```

### GET /staff/salary
Get salary details.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `month` (optional): Month in YYYY-MM format

**Response:**
```json
{
  "month_year": "2024-01",
  "basic_salary": 50000,
  "working_days": 22,
  "present_days": 20,
  "salary_for_days": 45454.55,
  "target_incentive": 5000,
  "basic_incentive": 2500,
  "gross_salary": 52954.55,
  "advance_deduction": 2000,
  "net_salary": 50954.55,
  "payment_status": "paid"
}
```

## Admin Endpoints

### GET /admin/dashboard
Get admin dashboard data.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "total_staff": 25,
  "total_sales": 1500000,
  "total_attendance": 95.5,
  "pending_salaries": 5,
  "recent_activities": [
    {
      "action": "New staff added",
      "timestamp": "2024-01-15T10:30:00"
    }
  ]
}
```

### Staff Management

#### GET /admin/staff
Get all staff members.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response:**
```json
[
  {
    "id": 1,
    "employee_code": "EMP001",
    "name": "John Doe",
    "email": "john@example.com",
    "department": "Sales",
    "basic_salary": 50000,
    "is_active": true,
    "created_at": "2024-01-01T00:00:00"
  }
]
```

#### POST /admin/staff
Create new staff member.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Request Body:**
```json
{
  "employee_code": "EMP002",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "password123",
  "basic_salary": 45000,
  "incentive_percentage": 5,
  "department": "Sales"
}
```

**Response:**
```json
{
  "message": "Staff member created successfully",
  "staff_id": 2
}
```

#### PUT /admin/staff/{staff_id}
Update staff member.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Request Body:**
```json
{
  "name": "Jane Smith Updated",
  "email": "jane.updated@example.com",
  "basic_salary": 50000
}
```

#### DELETE /admin/staff/{staff_id}
Delete staff member.

**Headers:**
```
Authorization: Bearer <admin-token>
```

### Sales Management

#### GET /admin/sales
Get all sales records.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Query Parameters:**
- `start_date` (optional): Start date (YYYY-MM-DD)
- `end_date` (optional): End date (YYYY-MM-DD)
- `staff_id` (optional): Filter by staff
- `brand_id` (optional): Filter by brand

#### POST /admin/sales
Create sales record.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Request Body:**
```json
{
  "staff_id": 1,
  "brand_id": 1,
  "sale_amount": 15000,
  "sale_date": "2024-01-15",
  "units_sold": 3
}
```

#### POST /admin/sales/upload-excel
Upload Excel file with sales data.

**Headers:**
```
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data
```

**Request Body:**
```
file: <excel-file>
```

**Response:**
```json
{
  "message": "Excel file processed successfully",
  "processed_count": 150,
  "errors": []
}
```

### Target Management

#### GET /admin/targets
Get all targets.

**Headers:**
```
Authorization: Bearer <admin-token>
```

#### POST /admin/targets
Create new target.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Request Body:**
```json
{
  "staff_id": 1,
  "target_amount": 500000,
  "target_period": "monthly",
  "start_date": "2024-01-01",
  "end_date": "2024-01-31",
  "description": "January 2024 target"
}
```

### Salary Management

#### GET /admin/salary
Get salary records.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Query Parameters:**
- `month` (optional): Month in YYYY-MM format
- `status` (optional): pending, approved, paid

#### POST /admin/salary/calculate
Calculate salaries for a month.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Request Body:**
```json
{
  "month_year": "2024-01"
}
```

#### POST /admin/salary/approve
Approve salary payment.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Request Body:**
```json
{
  "salary_id": 1
}
```

### Backup Management

#### GET /admin/backup/status
Get backup status.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "last_backup": "2024-01-15T02:00:00",
  "backup_size": "15.2 MB",
  "next_backup": "2024-01-16T02:00:00",
  "backup_count": 30
}
```

#### POST /admin/backup/create
Create manual backup.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "message": "Backup created successfully",
  "backup_file": "backup_20240115_140000.sql.gz"
}
```

#### POST /admin/backup/restore
Restore from backup.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Request Body:**
```json
{
  "backup_file": "backup_20240115_140000.sql.gz"
}
```

### Reports & Analytics

#### GET /admin/reports/sales
Get sales report.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Query Parameters:**
- `start_date`: Start date (YYYY-MM-DD)
- `end_date`: End date (YYYY-MM-DD)
- `format` (optional): json, excel, pdf

#### GET /admin/reports/attendance
Get attendance report.

**Headers:**
```
Authorization: Bearer <admin-token>
```

#### GET /admin/reports/performance
Get performance report.

**Headers:**
```
Authorization: Bearer <admin-token>
```

### System Settings

#### GET /admin/settings
Get system settings.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "wifi_mac_addresses": ["AA:BB:CC:DD:EE:FF"],
  "local_network_subnet": "192.168.1.0/24",
  "backup_settings": {
    "enabled": true,
    "frequency": "daily",
    "retention_days": 30
  }
}
```

#### PUT /admin/settings
Update system settings.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Request Body:**
```json
{
  "wifi_mac_addresses": ["AA:BB:CC:DD:EE:FF", "11:22:33:44:55:66"],
  "local_network_subnet": "192.168.1.0/24",
  "backup_settings": {
    "enabled": true,
    "frequency": "daily",
    "retention_days": 30
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 422 | Unprocessable Entity - Validation error |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Staff endpoints**: 60 requests per minute
- **Admin endpoints**: 100 requests per minute
- **Authentication endpoints**: 10 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1640995200
```

## Security Headers

All responses include security headers:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
```

## WebSocket Endpoints

### /ws/notifications
Real-time notifications WebSocket connection.

**Connection:**
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/notifications');
ws.onopen = function() {
    ws.send(JSON.stringify({
        'type': 'auth',
        'token': 'your-jwt-token'
    }));
};
```

**Message Types:**
- `notification`: New notification
- `attendance_update`: Attendance status update
- `salary_update`: Salary status update

## Testing

### Health Check
```
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00",
  "version": "1.0.0"
}
```

### Performance Metrics
```
GET /admin/performance
```

**Response:**
```json
{
  "performance_score": 85,
  "system": {
    "cpu_usage": 45.2,
    "memory_usage": 67.8,
    "disk_usage": 23.4
  },
  "api": {
    "average_response_time": 0.245,
    "total_requests": 1250
  }
}
```

## SDK Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Login
const login = async (employeeCode, password) => {
  const response = await api.post('/auth/login', {
    employee_code: employeeCode,
    password: password
  });
  return response.data;
};

// Check in
const checkIn = async () => {
  const response = await api.post('/staff/check-in', {
    wifi_mac_address: 'AA:BB:CC:DD:EE:FF'
  });
  return response.data;
};
```

### Python
```python
import requests

class StaffAttendanceAPI:
    def __init__(self, base_url, token=None):
        self.base_url = base_url
        self.token = token
        self.headers = {'Authorization': f'Bearer {token}'} if token else {}
    
    def login(self, employee_code, password):
        response = requests.post(
            f'{self.base_url}/auth/login',
            json={'employee_code': employee_code, 'password': password}
        )
        return response.json()
    
    def check_in(self, wifi_mac_address):
        response = requests.post(
            f'{self.base_url}/staff/check-in',
            json={'wifi_mac_address': wifi_mac_address},
            headers=self.headers
        )
        return response.json()
```

## Changelog

### v1.0.0
- Initial API release
- Complete authentication system
- Staff and admin endpoints
- Mobile-responsive design
- Security features
- Performance monitoring
- Comprehensive documentation