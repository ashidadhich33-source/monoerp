# Staff Attendance & Payout System

A comprehensive staff attendance and sales management system with fraud prevention, automated salary calculation, and performance tracking capabilities.

## Features

### Core Functionality
- **Staff Management**: Complete staff lifecycle management with role-based access
- **Attendance Tracking**: Real-time attendance monitoring with fraud prevention
- **Sales Management**: Comprehensive sales tracking and reporting
- **Target Management**: Goal setting and achievement tracking
- **Salary Calculation**: Automated salary computation with incentives
- **Advance Management**: Employee advance tracking and deduction planning
- **Performance Analytics**: Detailed performance metrics and rankings
- **Report Generation**: Export capabilities for all data types

### Security Features
- **Network-based Access Control**: Local network verification for security
- **Device Fingerprinting**: MAC address-based device authentication
- **Role-based Permissions**: Admin and staff access levels
- **Data Encryption**: Secure data storage and transmission

### Advanced Features
- **Real-time Notifications**: System alerts and user notifications
- **Excel Integration**: Bulk data import/export capabilities
- **PDF Generation**: Salary slips and report generation
- **Backup & Recovery**: Automated data backup system
- **Audit Logging**: Comprehensive activity tracking

## Technology Stack

### Backend
- **FastAPI**: Modern, fast web framework for building APIs
- **SQLAlchemy**: SQL toolkit and Object-Relational Mapping (ORM)
- **PostgreSQL**: Robust, open-source relational database
- **Pydantic**: Data validation using Python type annotations
- **JWT**: JSON Web Token authentication
- **ReportLab**: PDF generation library
- **Pandas**: Data manipulation and analysis
- **OpenPyXL**: Excel file processing

### Frontend
- **React**: Modern JavaScript library for building user interfaces
- **React Router**: Declarative routing for React
- **Tailwind CSS**: Utility-first CSS framework
- **Axios**: Promise-based HTTP client
- **Context API**: State management solution

## Installation

### Prerequisites
- Python 3.8+
- Node.js 16+
- PostgreSQL 12+
- Git

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd staff-attendance-system
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Set up database**
   ```bash
   # Create PostgreSQL database
   createdb staff_attendance_db
   
   # Run migrations
   python -m alembic upgrade head
   ```

6. **Run the application**
   ```bash
   python main.py
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Run the application**
   ```bash
   npm start
   ```

## Configuration

### Environment Variables

#### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/staff_attendance_db

# Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Network Security
LOCAL_NETWORK_SUBNET=192.168.1.0/24
ALLOWED_WIFI_MAC_ADDRESSES=AA:BB:CC:DD:EE:FF,11:22:33:44:55:66

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_USE_TLS=true
EMAIL_NOTIFICATIONS_ENABLED=false

# File Storage
EXCEL_UPLOAD_PATH=./uploads/excel
BACKUP_PATH=./backups
LOG_PATH=./logs
TEMP_PATH=./temp
```

#### Frontend (.env.local)
```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_APP_NAME=Staff Attendance System
```

## Usage

### Initial Setup

1. **Access the application**
   - Open your browser and navigate to `http://localhost:3000`
   - You'll be redirected to the setup page

2. **Complete system setup**
   - Enter company information
   - Create admin account
   - Configure system settings

3. **Login and start using**
   - Use admin credentials to login
   - Begin adding staff members
   - Set up brands and targets

### User Roles

#### Admin Users
- Full system access
- Staff management
- System configuration
- Report generation
- Data export/import

#### Staff Users
- Personal dashboard
- Attendance marking
- Sales entry
- Performance tracking
- Salary viewing

### Key Workflows

#### Daily Operations
1. **Staff Check-in**: Staff members mark attendance
2. **Sales Entry**: Record daily sales transactions
3. **Performance Monitoring**: Track progress against targets
4. **Report Generation**: Generate daily/weekly reports

#### Monthly Operations
1. **Target Setting**: Define monthly targets for staff
2. **Salary Calculation**: Automated salary computation
3. **Advance Management**: Process advance requests
4. **Performance Review**: Analyze monthly performance

## API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/register` - Staff registration
- `POST /api/auth/refresh-token` - Token refresh

### Admin Endpoints
- `GET /api/admin/dashboard` - Admin dashboard data
- `GET /api/admin/staff/list` - Staff list
- `POST /api/admin/staff/create` - Create staff
- `PUT /api/admin/staff/update/{id}` - Update staff
- `GET /api/admin/sales/list` - Sales list
- `POST /api/admin/sales/create` - Create sales record
- `GET /api/admin/reports/sales/export/csv` - Export sales CSV
- `GET /api/admin/reports/sales/export/pdf` - Export sales PDF

### Staff Endpoints
- `GET /api/staff/dashboard/{id}` - Staff dashboard
- `POST /api/staff/attendance/check-in` - Check in
- `POST /api/staff/attendance/check-out` - Check out
- `GET /api/staff/sales/list` - Personal sales
- `GET /api/staff/salary/details/{month_year}` - Salary details

## Testing

### Running Tests

#### Backend Tests
```bash
cd backend
pip install -r requirements-test.txt
pytest
```

#### Frontend Tests
```bash
cd frontend
npm test
```

### Test Coverage
- Unit tests for all major components
- Integration tests for API endpoints
- End-to-end tests for critical workflows

## Deployment

### Production Deployment

#### Backend
1. **Set up production database**
2. **Configure environment variables**
3. **Set up reverse proxy (Nginx)**
4. **Configure SSL certificates**
5. **Set up monitoring and logging**

#### Frontend
1. **Build production bundle**
   ```bash
   npm run build
   ```
2. **Deploy to web server**
3. **Configure CDN (optional)**

### Docker Deployment

#### Backend Dockerfile
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "main.py"]
```

#### Frontend Dockerfile
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

## Security Considerations

### Network Security
- Local network access only
- MAC address verification
- IP address whitelisting

### Data Security
- Encrypted data transmission
- Secure password storage
- Regular security audits

### Access Control
- Role-based permissions
- Session management
- Audit logging

## Troubleshooting

### Common Issues

#### Backend Issues
- **Database connection errors**: Check database credentials and connectivity
- **Import errors**: Verify all dependencies are installed
- **Permission errors**: Check file permissions for upload directories

#### Frontend Issues
- **API connection errors**: Verify backend URL configuration
- **Build errors**: Check Node.js version and dependencies
- **Runtime errors**: Check browser console for detailed error messages

### Logs and Debugging
- Backend logs: `./logs/app.log`
- Frontend logs: Browser developer console
- Database logs: PostgreSQL logs

## Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests for new functionality
5. Submit a pull request

### Code Standards
- Follow PEP 8 for Python code
- Use ESLint for JavaScript code
- Write comprehensive tests
- Document new features

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## Changelog

### Version 1.0.0
- Initial release
- Core functionality implementation
- Security features
- Testing framework
- Documentation

---

**Note**: This system is designed for internal use within a local network environment. Ensure proper security measures are in place before deployment.