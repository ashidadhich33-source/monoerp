# Staff Attendance & Payout System

A comprehensive staff attendance and sales management system with fraud prevention, automated salary calculation, and performance tracking capabilities.

## 🚀 Features

### Core Functionality
- **Staff Management**: Complete CRUD operations for staff members
- **Attendance Tracking**: Check-in/out with fraud prevention
- **Sales Management**: Track sales with brand-wise analysis
- **Salary Calculation**: Automated salary calculation with incentives
- **Target Management**: Set and track sales targets
- **Advance Management**: Handle staff advances with deduction tracking
- **Reporting**: Comprehensive reports and analytics
- **Backup System**: Automated daily backups with restore functionality

### Security Features
- **Network Verification**: Local network access control
- **WiFi MAC Verification**: Device-based authentication
- **Time-window Validation**: Prevent backdated entries
- **Rate Limiting**: API rate limiting for security
- **Audit Logging**: Complete audit trail of all actions
- **Session Management**: Secure session handling

### Mobile-First Design
- **Responsive Interface**: Works on all device sizes
- **Touch-Friendly**: Optimized for mobile devices
- **Offline Capability**: Basic offline functionality
- **Progressive Web App**: PWA-ready features

## 🛠 Technology Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL (Primary), SQLite (Backup)
- **ORM**: SQLAlchemy with Alembic migrations
- **Authentication**: JWT with bcrypt password hashing
- **Caching**: Redis (optional)
- **File Processing**: openpyxl for Excel operations
- **Scheduling**: schedule for background tasks

### Frontend
- **Framework**: React.js
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Routing**: React Router DOM
- **State Management**: Context API

### Infrastructure
- **Web Server**: Nginx
- **Process Management**: systemd
- **Database**: PostgreSQL
- **Backup**: Automated daily backups
- **Monitoring**: Built-in performance monitoring

## 📋 Prerequisites

- Python 3.8+
- Node.js 16+
- PostgreSQL 12+
- Redis (optional)
- Nginx (production)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd staff-attendance-system
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Database Setup
```bash
# Create database
createdb staff_attendance_db

# Run migrations
alembic upgrade head
```

### 4. Environment Configuration
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 5. Frontend Setup
```bash
cd frontend
npm install
npm run build
```

### 6. Start the Application
```bash
# Backend
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Frontend (development)
cd frontend
npm start
```

## 🔧 Configuration

### Environment Variables
Copy `.env.example` to `.env` and configure:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost/staff_attendance_db

# Security
SECRET_KEY=your-secret-key-here
LOCAL_NETWORK_SUBNET=192.168.1.0/24
ALLOWED_WIFI_MAC_ADDRESSES=AA:BB:CC:DD:EE:FF

# Admin
ADMIN_EMPLOYEE_CODE=ADMIN001
ADMIN_PASSWORD=admin123

# File Paths
EXCEL_UPLOAD_PATH=./uploads
BACKUP_PATH=./backups
```

### Network Security
Configure allowed networks and WiFi MAC addresses:
```env
LOCAL_NETWORK_SUBNET=192.168.1.0/24
ALLOWED_WIFI_MAC_ADDRESSES=AA:BB:CC:DD:EE:FF,11:22:33:44:55:66
```

## 📱 Mobile-First Design

The application is designed with mobile-first principles:

- **Responsive Grid**: Adapts to all screen sizes
- **Touch Targets**: Minimum 44px touch targets
- **Swipe Gestures**: Swipeable cards and navigation
- **Collapsible Navigation**: Mobile-friendly menu
- **Bottom Navigation**: Easy thumb navigation
- **Responsive Tables**: Horizontal scroll on mobile

## 🔒 Security Implementation

### Fraud Prevention
- **WiFi MAC Verification**: Only allowed devices can access
- **Network Verification**: Local network access only
- **Time-window Validation**: Prevent backdated entries
- **Device Fingerprinting**: Track device characteristics
- **Session Management**: Secure session handling

### Access Control
- **Role-based Access**: Staff vs Admin permissions
- **JWT Authentication**: Secure token-based auth
- **Rate Limiting**: API rate limiting
- **Input Sanitization**: XSS and injection prevention

## 📊 Salary Calculation

The system uses a comprehensive salary calculation formula:

```
Salary for Days = (Basic Salary / Working Days) × Present Days
Target Incentive = (Sales - Target) × 10% (if target achieved)
Basic Incentive = Sales × Incentive Percentage
Gross Salary = Salary for Days + Target Incentive + Basic Incentive
Net Salary = Gross Salary - Advance Deduction
```

## 📈 Reporting & Analytics

### Available Reports
- **Sales Reports**: Brand-wise, staff-wise, period-wise
- **Attendance Reports**: Daily, monthly, yearly
- **Performance Reports**: Target achievement, rankings
- **Salary Reports**: Payment status, deductions
- **System Reports**: Usage statistics, performance metrics

### Export Options
- **Excel Export**: All reports can be exported to Excel
- **PDF Export**: Salary slips and reports
- **CSV Export**: Data export for analysis

## 🔄 Backup & Recovery

### Automated Backups
- **Daily Backups**: Automatic daily database backups
- **Compression**: gzip compression for storage efficiency
- **Retention**: Configurable retention period
- **Verification**: Backup integrity verification

### Manual Backup
```bash
# Create manual backup
python -m app.services.backup_service create

# Restore from backup
python -m app.services.backup_service restore backup_file.sql
```

## 🚀 Production Deployment

### Automated Deployment
```bash
# Run deployment script
sudo ./deploy.sh
```

### Manual Deployment
1. **Server Setup**: Install required packages
2. **Database Setup**: Configure PostgreSQL
3. **Application Setup**: Deploy application files
4. **Web Server**: Configure Nginx
5. **Process Management**: Setup systemd services
6. **Security**: Configure firewall and SSL

### Production Checklist
- [ ] Change default admin password
- [ ] Configure SSL certificates
- [ ] Setup firewall rules
- [ ] Configure backup retention
- [ ] Setup monitoring
- [ ] Test all functionality
- [ ] Configure allowed MAC addresses

## 🧪 Testing

### Run Tests
```bash
# Backend tests
cd backend
pytest tests/

# Frontend tests
cd frontend
npm test
```

### Test Coverage
- **Unit Tests**: Individual component testing
- **Integration Tests**: API endpoint testing
- **Security Tests**: Authentication and authorization
- **Performance Tests**: Load and stress testing

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh-token` - Refresh JWT token
- `GET /api/auth/verify-network` - Network verification

### Staff Endpoints
- `GET /api/staff/dashboard` - Staff dashboard
- `POST /api/staff/check-in` - Check in
- `POST /api/staff/check-out` - Check out
- `GET /api/staff/attendance` - Attendance history
- `GET /api/staff/sales` - Personal sales
- `GET /api/staff/rankings` - Performance rankings
- `GET /api/staff/salary` - Salary details

### Admin Endpoints
- `GET /api/admin/dashboard` - Admin dashboard
- `GET /api/admin/staff` - Staff management
- `POST /api/admin/staff` - Create staff
- `PUT /api/admin/staff/{id}` - Update staff
- `DELETE /api/admin/staff/{id}` - Delete staff
- `GET /api/admin/sales` - Sales management
- `POST /api/admin/sales` - Create sales record
- `GET /api/admin/targets` - Target management
- `GET /api/admin/salary` - Salary management
- `GET /api/admin/backup` - Backup management
- `GET /api/admin/reports` - Reports and analytics
- `GET /api/admin/settings` - System settings

## 🔧 Maintenance

### Daily Tasks
- Monitor system performance
- Check backup status
- Review security logs
- Update system if needed

### Weekly Tasks
- Review audit logs
- Check disk space
- Update dependencies
- Test backup restore

### Monthly Tasks
- Performance optimization
- Security audit
- Database maintenance
- Update documentation

## 🆘 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check database status
sudo systemctl status postgresql

# Check connection
psql -h localhost -U staff_user -d staff_attendance_db
```

#### Performance Issues
```bash
# Check system metrics
curl http://localhost:8000/api/admin/performance

# Check logs
journalctl -u staff-attendance-system-backend -f
```

#### Backup Issues
```bash
# Check backup status
curl http://localhost:8000/api/admin/backup/status

# Manual backup
python -m app.services.backup_service create
```

## 📞 Support

For technical support and questions:
- Check the troubleshooting section
- Review the API documentation
- Check system logs
- Contact system administrator

## 📄 License

This project is proprietary software. All rights reserved.

## 🔄 Version History

### v1.0.0
- Initial release
- Complete staff attendance system
- Sales management
- Salary calculation
- Mobile-responsive design
- Security features
- Backup system
- Performance monitoring

---

**Staff Attendance & Payout System** - A comprehensive solution for modern workforce management.