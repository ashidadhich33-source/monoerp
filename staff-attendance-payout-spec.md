# Staff Attendance & Payout System - Technical Specification

## Project Overview
A comprehensive staff attendance and sales management system with fraud prevention, automated salary calculation, and performance tracking capabilities.

## Technology Stack
- **Backend**: Python FastAPI with SQLAlchemy ORM
- **Frontend**: React.js + Node.js + Tailwind CSS (No TypeScript)
- **Database**: PostgreSQL (recommended) or MySQL
- **Local Storage**: SQLite for daily backups
- **No Docker requirement** - Direct deployment on local server

## System Architecture

### 1. Fraud Prevention Mechanism
**Recommended Approach: Hybrid System**
- **Primary**: Local WiFi MAC Address verification
- **Secondary**: IP Range restriction for local network
- **Tertiary**: Time-window based check-in (prevents multiple rapid check-ins)

**Implementation Details:**
- Store office WiFi router MAC addresses in database
- Staff devices must be connected to office WiFi to mark attendance
- Admin can whitelist specific MAC addresses for enhanced security
- Implement session tokens that expire after work hours
- Add device fingerprinting for additional security layer

### 2. Database Schema

```sql
-- Core Tables Structure

Staff
- id (Primary Key)
- employee_code (Unique)
- name
- email
- phone
- basic_salary
- incentive_percentage
- department
- joining_date
- is_active
- created_at
- updated_at

Attendance
- id
- staff_id (Foreign Key)
- check_in_time
- check_out_time
- date
- wifi_mac_address
- ip_address
- device_fingerprint
- status (present/absent/half-day/holiday)
- created_at

Sales
- id
- staff_id (Foreign Key)
- brand_id (Foreign Key)
- sale_amount
- sale_date
- units_sold
- created_at
- updated_at

Brands
- id
- brand_name
- brand_code
- is_active
- created_at

Targets
- id
- staff_id (Foreign Key)
- target_type (weekly/monthly/quarterly/yearly)
- total_target_amount
- brand_wise_targets (JSON)
- period_start
- period_end
- incentive_percentage
- created_at

Achievements
- id
- staff_id
- target_id
- achieved_amount
- achievement_percentage
- incentive_earned
- period
- created_at

Salary
- id
- staff_id
- month_year
- basic_salary
- working_days
- present_days
- sunday_count
- salary_for_days
- target_incentive
- basic_incentive
- gross_salary
- advance_deduction
- net_salary
- payment_status
- payment_date
- created_at

Advances
- id
- staff_id
- advance_amount
- reason
- issue_date
- total_deducted
- remaining_amount
- deduction_plan (full/partial)
- monthly_deduction_amount
- status (active/cleared)
- created_at

Rankings
- id
- staff_id
- period_type (weekly/monthly/quarterly/yearly)
- period_date
- total_sales
- rank_position
- created_at
```

## API Endpoints Structure

### Authentication Endpoints
```
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh-token
GET /api/auth/verify-network (checks if on local network)
```

### Staff Panel Endpoints (Local Network Only)
```
GET /api/staff/dashboard/{staff_id}
POST /api/staff/attendance/check-in
POST /api/staff/attendance/check-out
GET /api/staff/attendance/history
GET /api/staff/sales/personal
GET /api/staff/sales/all-staff
GET /api/staff/rankings/{period_type}
GET /api/staff/salary/details/{month_year}
GET /api/staff/targets/current
GET /api/staff/achievements
```

### Admin Panel Endpoints
```
# Staff Management
GET /api/admin/staff/list
POST /api/admin/staff/create
PUT /api/admin/staff/update/{id}
DELETE /api/admin/staff/delete/{id}

# Sales Management
POST /api/admin/sales/add
POST /api/admin/sales/bulk-upload (Excel upload)
GET /api/admin/sales/report
PUT /api/admin/sales/update/{id}

# Target Management
POST /api/admin/targets/set
PUT /api/admin/targets/update/{id}
GET /api/admin/targets/list

# Salary Management
GET /api/admin/salary/calculate/{month_year}
POST /api/admin/salary/approve
GET /api/admin/salary/report

# Advance Management
POST /api/admin/advance/issue
PUT /api/admin/advance/update-deduction
GET /api/admin/advance/list

# Brand Management
POST /api/admin/brands/add
PUT /api/admin/brands/update/{id}
GET /api/admin/brands/list

# Backup
POST /api/admin/backup/create
GET /api/admin/backup/list
POST /api/admin/backup/restore/{backup_id}
```

## Frontend Structure

### Staff Panel Pages
1. **Login Page** (Network verification)
2. **Dashboard**
   - Today's attendance status
   - Personal sales summary
   - Current month target vs achievement
   - Quick stats
3. **Attendance Page**
   - Check-in/Check-out button
   - Monthly calendar view
   - Attendance history
4. **Sales View**
   - Personal sales (filterable by date range)
   - All staff sales comparison
   - Brand-wise breakdown
5. **Rankings Page**
   - Weekly/Monthly/Quarterly/Yearly leaderboards
   - Personal position highlight
6. **Salary Page**
   - Detailed salary breakdown
   - Advance deduction status
   - Historical salary slips

### Admin Panel Pages
1. **Dashboard**
   - Overall statistics
   - Today's attendance summary
   - Sales overview
   - Pending approvals
2. **Staff Management**
   - Add/Edit/Delete staff
   - View individual staff details
   - Bulk actions
3. **Attendance Management**
   - View all attendance
   - Manual attendance marking
   - Attendance reports
4. **Sales Management**
   - Add daily sales
   - Excel upload interface
   - Sales analytics
   - Brand-wise reports
5. **Target Management**
   - Set targets (all periods)
   - Brand-wise target allocation
   - Target vs Achievement reports
6. **Salary Management**
   - Auto-calculated salaries view
   - Approval interface
   - Salary slip generation
   - Bulk salary processing
7. **Advance Management**
   - Issue advances
   - Set deduction plans
   - Track deductions
8. **Reports & Analytics**
   - Comprehensive reporting
   - Export capabilities
9. **Settings**
   - WiFi MAC address configuration
   - Backup settings
   - System configurations

## Salary Calculation Formula Implementation

```python
def calculate_salary(staff_id, month_year):
    # Formula: (basic_salary/30 * working_days) + (basic_salary/30 * sundays) + target_incentive + basic_incentive - advance_deduction
    
    basic_salary = get_basic_salary(staff_id)
    working_days = get_working_days(staff_id, month_year)
    sunday_count = get_sunday_count(month_year)
    
    # Base calculation
    daily_rate = basic_salary / 30
    salary_for_days = daily_rate * working_days
    sunday_bonus = daily_rate * sunday_count
    
    # Incentives
    target_incentive = calculate_target_incentive(staff_id, month_year)
    basic_incentive = calculate_basic_incentive(staff_id)
    
    # Gross salary
    gross_salary = salary_for_days + sunday_bonus + target_incentive + basic_incentive
    
    # Deductions
    advance_deduction = get_advance_deduction(staff_id, month_year)
    
    # Net salary
    net_salary = gross_salary - advance_deduction
    
    return {
        'basic_salary': basic_salary,
        'working_days': working_days,
        'sunday_count': sunday_count,
        'salary_for_days': salary_for_days,
        'sunday_bonus': sunday_bonus,
        'target_incentive': target_incentive,
        'basic_incentive': basic_incentive,
        'gross_salary': gross_salary,
        'advance_deduction': advance_deduction,
        'net_salary': net_salary
    }
```

## Security Implementation

### Network Restriction for Staff Panel
```python
# FastAPI Middleware
async def verify_local_network(request: Request):
    client_ip = request.client.host
    allowed_subnet = "192.168.1.0/24"  # Configure as per your network
    
    if not is_ip_in_subnet(client_ip, allowed_subnet):
        raise HTTPException(status_code=403, detail="Access denied: Not on local network")
    
    # Additional WiFi MAC verification
    mac_address = request.headers.get("X-Device-MAC")
    if not verify_mac_address(mac_address):
        raise HTTPException(status_code=403, detail="Access denied: Invalid device")
```

### Daily Backup System
```python
# Scheduled task for daily backup
import schedule
import sqlite3
from datetime import datetime

def daily_backup():
    backup_date = datetime.now().strftime("%Y%m%d")
    backup_file = f"backups/backup_{backup_date}.db"
    
    # Create SQLite backup
    # Copy all tables data to SQLite database
    # Compress and store
    
schedule.every().day.at("23:00").do(daily_backup)
```

## Excel Upload Format for Sales

### Required Excel Structure:
| Date | Staff Name/ID | Brand Name | Sale Amount | Units Sold |
|------|---------------|------------|-------------|------------|
| 2024-01-15 | EMP001 | Brand A | 15000 | 10 |
| 2024-01-15 | EMP002 | Brand B | 25000 | 15 |

## Mobile Responsive Design Guidelines

### Tailwind CSS Configuration
```javascript
// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
      }
    }
  }
}
```

### Mobile-First Components
- Use responsive grid system
- Implement touch-friendly buttons (min 44px touch target)
- Collapsible navigation menu
- Swipeable cards for rankings
- Responsive tables with horizontal scroll
- Bottom navigation for quick access

## Development Phases

### Phase 1: Core Backend (Week 1-2)
- Database setup and models
- Authentication system
- Basic CRUD APIs
- Network verification middleware

### Phase 2: Admin Panel (Week 2-3)
- Staff management
- Sales data entry
- Target setting
- Basic reporting

### Phase 3: Staff Panel (Week 3-4)
- Attendance system with fraud prevention
- Personal dashboard
- Sales viewing
- Rankings display

### Phase 4: Advanced Features (Week 4-5)
- Salary calculation engine
- Advance management
- Excel upload functionality
- Comprehensive reporting

### Phase 5: Testing & Deployment (Week 5-6)
- Unit testing
- Integration testing
- Performance optimization
- Local server deployment
- Documentation

## Environment Variables (.env)
```
DATABASE_URL=postgresql://user:password@localhost/staff_db
SECRET_KEY=your-secret-key-here
BACKUP_PATH=/path/to/backups
LOCAL_NETWORK_SUBNET=192.168.1.0/24
WIFI_MAC_ADDRESSES=AA:BB:CC:DD:EE:FF,11:22:33:44:55:66
JWT_EXPIRY_HOURS=8
ADMIN_DEFAULT_PASSWORD=changeMe123
EXCEL_UPLOAD_PATH=/path/to/uploads
```

## Deployment Instructions

### Local Server Setup (Without Docker)
1. Install Python 3.9+ and Node.js 16+
2. Install PostgreSQL or MySQL
3. Clone repository
4. Backend setup:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   alembic upgrade head  # Run migrations
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```
5. Frontend setup:
   ```bash
   cd frontend
   npm install
   npm run build
   npm start
   ```
6. Configure nginx for reverse proxy (optional but recommended)

## Additional Recommendations

1. **Performance Optimization**
   - Implement Redis for caching frequently accessed data
   - Use pagination for large data sets
   - Optimize database queries with proper indexing

2. **Enhanced Security**
   - Implement rate limiting on APIs
   - Add CSRF protection
   - Use HTTPS even on local network
   - Regular security audits

3. **User Experience**
   - Progressive Web App (PWA) for better mobile experience
   - Offline capability for viewing cached data
   - Push notifications for important updates

4. **Monitoring**
   - Implement logging system
   - Error tracking
   - Performance monitoring
   - Audit trails for all admin actions

5. **Future Enhancements**
   - Biometric attendance (fingerprint reader integration)
   - QR code based attendance as backup
   - Mobile app version
   - Cloud sync capability
   - Multi-branch support

## Testing Checklist
- [ ] Attendance marking from local network only
- [ ] Salary calculation accuracy
- [ ] Excel upload functionality
- [ ] Advance deduction logic
- [ ] Rankings calculation
- [ ] Mobile responsiveness
- [ ] Backup and restore
- [ ] Concurrent user handling
- [ ] Data validation
- [ ] Error handling

## Support & Maintenance
- Weekly backup verification
- Monthly security updates
- Quarterly performance review
- User feedback incorporation
- Regular feature updates based on requirements