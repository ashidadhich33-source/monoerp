#!/bin/bash

# Staff Attendance & Payout System Deployment Script
# This script deploys the application to a production server

set -e  # Exit on any error

echo "🚀 Starting deployment of Staff Attendance & Payout System..."

# Configuration
APP_NAME="staff-attendance-system"
BACKEND_DIR="/opt/$APP_NAME/backend"
FRONTEND_DIR="/opt/$APP_NAME/frontend"
NGINX_DIR="/etc/nginx/sites-available"
SERVICE_DIR="/etc/systemd/system"
LOG_DIR="/var/log/$APP_NAME"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root (use sudo)"
    exit 1
fi

# Update system packages
print_status "Updating system packages..."
apt update && apt upgrade -y

# Install required packages
print_status "Installing required packages..."
apt install -y python3 python3-pip python3-venv nodejs npm nginx postgresql postgresql-contrib redis-server git

# Create application user
print_status "Creating application user..."
if ! id "$APP_NAME" &>/dev/null; then
    useradd -m -s /bin/bash $APP_NAME
fi

# Create application directories
print_status "Creating application directories..."
mkdir -p $BACKEND_DIR
mkdir -p $FRONTEND_DIR
mkdir -p $LOG_DIR
chown -R $APP_NAME:$APP_NAME /opt/$APP_NAME
chown -R $APP_NAME:$APP_NAME $LOG_DIR

# Setup backend
print_status "Setting up backend..."
cd $BACKEND_DIR

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Create environment file
cat > .env << EOF
# Database Configuration
DATABASE_URL=postgresql://staff_user:staff_password@localhost/staff_attendance_db

# Security
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480

# Network Security
LOCAL_NETWORK_SUBNET=192.168.1.0/24
ALLOWED_WIFI_MAC_ADDRESSES=AA:BB:CC:DD:EE:FF,11:22:33:44:55:66

# File Paths
EXCEL_UPLOAD_PATH=/opt/$APP_NAME/uploads
BACKUP_PATH=/opt/$APP_NAME/backups

# Admin Configuration
ADMIN_EMPLOYEE_CODE=ADMIN001
ADMIN_EMAIL=admin@company.com
ADMIN_PASSWORD=admin123

# Application Settings
APP_NAME=Staff Attendance & Payout System
VERSION=1.0.0
DEBUG=False
EOF

# Create upload and backup directories
mkdir -p /opt/$APP_NAME/uploads
mkdir -p /opt/$APP_NAME/backups
chown -R $APP_NAME:$APP_NAME /opt/$APP_NAME

# Setup database
print_status "Setting up database..."
sudo -u postgres psql << EOF
CREATE DATABASE staff_attendance_db;
CREATE USER staff_user WITH PASSWORD 'staff_password';
GRANT ALL PRIVILEGES ON DATABASE staff_attendance_db TO staff_user;
\q
EOF

# Run database migrations
print_status "Running database migrations..."
source venv/bin/activate
alembic upgrade head

# Setup frontend
print_status "Setting up frontend..."
cd $FRONTEND_DIR

# Install Node.js dependencies
npm install

# Build frontend for production
npm run build

# Create systemd service for backend
print_status "Creating systemd service..."
cat > $SERVICE_DIR/$APP_NAME-backend.service << EOF
[Unit]
Description=Staff Attendance System Backend
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=$APP_NAME
WorkingDirectory=$BACKEND_DIR
Environment=PATH=$BACKEND_DIR/venv/bin
ExecStart=$BACKEND_DIR/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Create systemd service for frontend
cat > $SERVICE_DIR/$APP_NAME-frontend.service << EOF
[Unit]
Description=Staff Attendance System Frontend
After=network.target

[Service]
Type=simple
User=$APP_NAME
WorkingDirectory=$FRONTEND_DIR
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Configure Nginx
print_status "Configuring Nginx..."
cat > $NGINX_DIR/$APP_NAME << EOF
server {
    listen 80;
    server_name _;

    # Frontend
    location / {
        root $FRONTEND_DIR/build;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
EOF

# Enable and start services
print_status "Enabling and starting services..."
systemctl daemon-reload
systemctl enable $APP_NAME-backend
systemctl enable $APP_NAME-frontend
systemctl enable nginx
systemctl enable postgresql
systemctl enable redis-server

systemctl start postgresql
systemctl start redis-server
systemctl start $APP_NAME-backend
systemctl start $APP_NAME-frontend
systemctl start nginx

# Setup log rotation
print_status "Setting up log rotation..."
cat > /etc/logrotate.d/$APP_NAME << EOF
$LOG_DIR/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $APP_NAME $APP_NAME
    postrotate
        systemctl reload $APP_NAME-backend
        systemctl reload $APP_NAME-frontend
    endscript
}
EOF

# Setup firewall
print_status "Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Create backup script
print_status "Creating backup script..."
cat > /opt/$APP_NAME/backup.sh << 'EOF'
#!/bin/bash
# Daily backup script

BACKUP_DIR="/opt/staff-attendance-system/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_$DATE.sql"

# Create backup
pg_dump staff_attendance_db > $BACKUP_DIR/$BACKUP_FILE

# Compress backup
gzip $BACKUP_DIR/$BACKUP_FILE

# Remove backups older than 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
EOF

chmod +x /opt/$APP_NAME/backup.sh
chown $APP_NAME:$APP_NAME /opt/$APP_NAME/backup.sh

# Setup cron job for daily backups
print_status "Setting up daily backups..."
echo "0 2 * * * $APP_NAME /opt/$APP_NAME/backup.sh" >> /etc/crontab

# Final status check
print_status "Checking service status..."
systemctl status $APP_NAME-backend --no-pager
systemctl status $APP_NAME-frontend --no-pager
systemctl status nginx --no-pager

print_status "🎉 Deployment completed successfully!"
print_status "Application is available at: http://your-server-ip"
print_status "Admin credentials:"
print_status "  Employee Code: ADMIN001"
print_status "  Password: admin123"
print_warning "Please change the admin password and secret key in production!"

# Display useful commands
echo ""
print_status "Useful commands:"
echo "  Check backend logs: journalctl -u $APP_NAME-backend -f"
echo "  Check frontend logs: journalctl -u $APP_NAME-frontend -f"
echo "  Restart backend: systemctl restart $APP_NAME-backend"
echo "  Restart frontend: systemctl restart $APP_NAME-frontend"
echo "  Check status: systemctl status $APP_NAME-backend $APP_NAME-frontend"
echo ""