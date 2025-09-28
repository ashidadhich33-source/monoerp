# Staff Attendance & Payout System

A comprehensive staff attendance and sales management system with fraud prevention, automated salary calculation, and performance tracking capabilities.

## Features

### Core Features
- **Fraud Prevention**: WiFi MAC address verification and local network restrictions
- **Attendance Management**: Check-in/check-out with device fingerprinting
- **Sales Tracking**: Personal and team sales performance monitoring
- **Salary Calculation**: Automated salary calculation with the specified formula
- **Target Management**: Set and track sales targets for staff
- **Rankings**: Weekly/Monthly/Quarterly/Yearly leaderboards
- **Advance Management**: Issue and track staff advances
- **Backup System**: Daily automated backups with SQLite storage

### Technology Stack
- **Backend**: Python FastAPI with SQLAlchemy ORM
- **Frontend**: React.js with TypeScript and Tailwind CSS
- **Database**: SQLite (configurable to PostgreSQL/MySQL)
- **Authentication**: JWT tokens with network verification

## Project Structure

```
/workspace/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── models/         # Database models
│   │   ├── routers/        # API endpoints
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Utility functions
│   │   └── config/         # Configuration
│   ├── main.py            # FastAPI application
│   └── requirements.txt    # Python dependencies
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   ├── services/      # API services
│   │   └── utils/         # Utility functions
│   └── package.json       # Node.js dependencies
└── README.md              # This file
```

## Setup Instructions

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

5. **Run the application:**
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Staff login with network verification
- `POST /api/auth/logout` - Staff logout
- `GET /api/auth/verify-network` - Check network status

### Staff Panel (Local Network Only)
- `GET /api/staff/dashboard/{staff_id}` - Staff dashboard data
- `POST /api/staff/attendance/check-in` - Check in
- `POST /api/staff/attendance/check-out` - Check out
- `GET /api/staff/attendance/history` - Attendance history
- `GET /api/staff/sales/personal` - Personal sales data
- `GET /api/staff/sales/all-staff` - All staff sales
- `GET /api/staff/rankings/{period_type}` - Rankings
- `GET /api/staff/salary/details/{month_year}` - Salary details

### Admin Panel
- `GET /api/admin/staff/list` - List all staff
- `POST /api/admin/staff/create` - Create staff
- `PUT /api/admin/staff/update/{id}` - Update staff
- `DELETE /api/admin/staff/delete/{id}` - Delete staff
- `POST /api/admin/sales/add` - Add sales record
- `POST /api/admin/sales/bulk-upload` - Bulk upload sales
- `GET /api/admin/sales/report` - Sales report
- `POST /api/admin/targets/set` - Set targets
- `GET /api/admin/targets/list` - List targets
- `POST /api/admin/advance/issue` - Issue advance
- `GET /api/admin/advance/list` - List advances
- `GET /api/admin/salary/calculate/{month_year}` - Calculate salaries
- `POST /api/admin/salary/approve` - Approve salaries
- `GET /api/admin/salary/report` - Salary report
- `POST /api/admin/backup/create` - Create backup
- `GET /api/admin/backup/list` - List backups
- `POST /api/admin/backup/restore/{backup_id}` - Restore backup

## Salary Calculation Formula

The system implements the following salary calculation formula:

```
Net Salary = (Basic Salary/30 * Working Days) + (Basic Salary/30 * Sundays) + Target Incentive + Basic Incentive - Advance Deduction
```

Where:
- **Working Days**: Total working days in the month (excluding Sundays)
- **Sundays**: Number of Sundays in the month
- **Target Incentive**: Based on target achievement percentage
- **Basic Incentive**: Based on total sales and staff incentive percentage
- **Advance Deduction**: Monthly advance deductions

## Security Features

### Network Security
- **Local Network Verification**: Only allows access from configured local network
- **WiFi MAC Address Verification**: Validates device MAC addresses
- **Device Fingerprinting**: Tracks device characteristics for additional security

### Authentication
- **JWT Tokens**: Secure token-based authentication
- **Session Management**: Automatic token refresh and expiration
- **Role-based Access**: Separate staff and admin panels

## Database Schema

The system includes the following main tables:
- **Staff**: Employee information and settings
- **Attendance**: Check-in/check-out records with security data
- **Sales**: Sales transactions and performance data
- **Brands**: Product brand information
- **Targets**: Sales targets and goals
- **Achievements**: Target achievement records
- **Salary**: Calculated salary records
- **Advances**: Staff advance records
- **Rankings**: Performance rankings

## Deployment

### Local Server Deployment (Without Docker)

1. **Install Dependencies:**
   ```bash
   # Install Python 3.9+ and Node.js 16+
   # Install PostgreSQL or MySQL (optional, SQLite is default)
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

3. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   npm run build
   npm start
   ```

4. **Configure Nginx (Optional):**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
       }
       
       location /api {
           proxy_pass http://localhost:8000;
       }
   }
   ```

## Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Database
DATABASE_URL=sqlite:///./staff_attendance.db

# Security
SECRET_KEY=your-secret-key-here
JWT_EXPIRY_HOURS=8

# Network Security
LOCAL_NETWORK_SUBNET=192.168.1.0/24
WIFI_MAC_ADDRESSES=AA:BB:CC:DD:EE:FF,11:22:33:44:55:66

# Admin
ADMIN_DEFAULT_PASSWORD=changeMe123

# File Upload
EXCEL_UPLOAD_PATH=./uploads
BACKUP_PATH=./backups

# Application
DEBUG=True
APP_NAME=Staff Attendance & Payout System
VERSION=1.0.0
```

## Testing

### Backend Testing
```bash
cd backend
python -m pytest tests/
```

### Frontend Testing
```bash
cd frontend
npm test
```

## Support & Maintenance

- **Weekly Backup Verification**: Check backup system status
- **Monthly Security Updates**: Update dependencies and security patches
- **Quarterly Performance Review**: Monitor system performance
- **User Feedback Incorporation**: Regular feature updates based on requirements

## License

This project is proprietary software. All rights reserved.

## Contact

For support and questions, please contact the development team.