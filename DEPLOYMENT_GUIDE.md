# Deployment Guide

## Overview

This guide covers deploying the Staff Attendance & Payout System in various environments, from development to production.

## Prerequisites

### System Requirements

#### Minimum Requirements
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 20GB SSD
- **Network**: 100 Mbps

#### Recommended Requirements
- **CPU**: 4 cores
- **RAM**: 8GB
- **Storage**: 50GB SSD
- **Network**: 1 Gbps

### Software Requirements

#### Backend
- Python 3.8+
- PostgreSQL 12+
- Redis (optional, for caching)
- Nginx (for reverse proxy)

#### Frontend
- Node.js 16+
- npm or yarn

#### System
- Ubuntu 20.04+ / CentOS 8+ / Windows Server 2019+
- Docker (optional)
- SSL certificates

## Development Deployment

### Local Development Setup

#### 1. Backend Setup
```bash
# Clone repository
git clone <repository-url>
cd staff-attendance-system/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Set up database
createdb staff_attendance_db
python -m alembic upgrade head

# Run the application
python main.py
```

#### 2. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Run the application
npm start
```

### Docker Development

#### 1. Backend Docker
```dockerfile
# Dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p logs uploads backups temp

# Expose port
EXPOSE 8000

# Run the application
CMD ["python", "main.py"]
```

#### 2. Frontend Docker
```dockerfile
# Dockerfile
FROM node:16-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
```

#### 3. Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  db:
    image: postgres:13
    environment:
      POSTGRES_DB: staff_attendance_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/staff_attendance_db
    depends_on:
      - db
    volumes:
      - ./backend:/app
      - ./uploads:/app/uploads
      - ./logs:/app/logs

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:8000
    depends_on:
      - backend
    volumes:
      - ./frontend:/app
      - /app/node_modules

volumes:
  postgres_data:
```

## Staging Deployment

### Server Setup

#### 1. Ubuntu Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y python3.9 python3.9-venv python3-pip postgresql postgresql-contrib nginx certbot python3-certbot-nginx

# Create application user
sudo useradd -m -s /bin/bash staffapp
sudo usermod -aG sudo staffapp
```

#### 2. Database Setup
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE staff_attendance_db;
CREATE USER staffapp WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE staff_attendance_db TO staffapp;
\q
```

#### 3. Application Deployment
```bash
# Switch to application user
sudo -u staffapp bash

# Clone repository
cd /home/staffapp
git clone <repository-url> staff-attendance-system
cd staff-attendance-system

# Set up backend
cd backend
python3.9 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Edit .env with production settings

# Run migrations
python -m alembic upgrade head

# Set up frontend
cd ../frontend
npm install
npm run build
```

#### 4. Systemd Service Setup
```bash
# Create systemd service file
sudo nano /etc/systemd/system/staff-app.service
```

```ini
[Unit]
Description=Staff Attendance System
After=network.target

[Service]
Type=simple
User=staffapp
WorkingDirectory=/home/staffapp/staff-attendance-system/backend
Environment=PATH=/home/staffapp/staff-attendance-system/backend/venv/bin
ExecStart=/home/staffapp/staff-attendance-system/backend/venv/bin/python main.py
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable staff-app
sudo systemctl start staff-app
```

#### 5. Nginx Configuration
```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/staff-app
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /home/staffapp/staff-attendance-system/frontend/build;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/staff-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 6. SSL Certificate
```bash
# Install SSL certificate
sudo certbot --nginx -d your-domain.com
```

## Production Deployment

### High Availability Setup

#### 1. Load Balancer Configuration
```nginx
# /etc/nginx/nginx.conf
upstream backend {
    server 127.0.0.1:8000;
    server 127.0.0.1:8001;
    server 127.0.0.1:8002;
}

server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /var/www/staff-app/frontend/build;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### 2. Database Clustering
```bash
# PostgreSQL streaming replication setup
# Master server
sudo -u postgres psql
CREATE USER replicator WITH REPLICATION ENCRYPTED PASSWORD 'replication_password';
\q

# Edit postgresql.conf
sudo nano /etc/postgresql/13/main/postgresql.conf
```
```conf
wal_level = replica
max_wal_senders = 3
wal_keep_segments = 64
```

```bash
# Edit pg_hba.conf
sudo nano /etc/postgresql/13/main/pg_hba.conf
```
```conf
host replication replicator 192.168.1.0/24 md5
```

#### 3. Redis Caching
```bash
# Install Redis
sudo apt install redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf
```
```conf
maxmemory 256mb
maxmemory-policy allkeys-lru
```

### Monitoring and Logging

#### 1. Application Monitoring
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs

# Set up log rotation
sudo nano /etc/logrotate.d/staff-app
```
```
/home/staffapp/staff-attendance-system/backend/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 staffapp staffapp
}
```

#### 2. Database Monitoring
```bash
# Install PostgreSQL monitoring
sudo apt install postgresql-contrib
sudo -u postgres psql
CREATE EXTENSION pg_stat_statements;
\q
```

#### 3. System Monitoring
```bash
# Install monitoring agent
wget -O - https://packages.grafana.com/gpg/key | sudo apt-key add -
echo "deb https://packages.grafana.com/oss/deb stable main" | sudo tee /etc/apt/sources.list.d/grafana.list
sudo apt update
sudo apt install grafana
```

### Backup Strategy

#### 1. Database Backup
```bash
# Create backup script
sudo nano /home/staffapp/backup-db.sh
```
```bash
#!/bin/bash
BACKUP_DIR="/home/staffapp/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/staff_db_$DATE.sql"

mkdir -p $BACKUP_DIR
pg_dump -h localhost -U staffapp staff_attendance_db > $BACKUP_FILE
gzip $BACKUP_FILE

# Keep only last 30 days
find $BACKUP_DIR -name "staff_db_*.sql.gz" -mtime +30 -delete
```

```bash
# Make executable
chmod +x /home/staffapp/backup-db.sh

# Add to crontab
crontab -e
```
```
0 2 * * * /home/staffapp/backup-db.sh
```

#### 2. Application Backup
```bash
# Create application backup script
sudo nano /home/staffapp/backup-app.sh
```
```bash
#!/bin/bash
BACKUP_DIR="/home/staffapp/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/staff_app_$DATE.tar.gz"

mkdir -p $BACKUP_DIR
tar -czf $BACKUP_FILE -C /home/staffapp staff-attendance-system

# Keep only last 7 days
find $BACKUP_DIR -name "staff_app_*.tar.gz" -mtime +7 -delete
```

### Security Hardening

#### 1. Firewall Configuration
```bash
# Install UFW
sudo apt install ufw

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

#### 2. SSL/TLS Configuration
```bash
# Generate strong SSL configuration
sudo nano /etc/nginx/snippets/ssl-params.conf
```
```conf
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
ssl_stapling on;
ssl_stapling_verify on;
```

#### 3. Application Security
```bash
# Set up fail2ban
sudo apt install fail2ban
sudo nano /etc/fail2ban/jail.local
```
```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
```

### Performance Optimization

#### 1. Database Optimization
```sql
-- PostgreSQL configuration tuning
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
SELECT pg_reload_conf();
```

#### 2. Application Optimization
```python
# Gunicorn configuration
# gunicorn.conf.py
bind = "0.0.0.0:8000"
workers = 4
worker_class = "uvicorn.workers.UvicornWorker"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 100
timeout = 30
keepalive = 2
```

#### 3. Frontend Optimization
```bash
# Build with optimization
npm run build

# Set up compression
sudo nano /etc/nginx/snippets/compression.conf
```
```conf
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_proxied any;
gzip_comp_level 6;
gzip_types
    text/plain
    text/css
    text/xml
    text/javascript
    application/json
    application/javascript
    application/xml+rss
    application/atom+xml
    image/svg+xml;
```

## Docker Deployment

### Docker Compose Production
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  db:
    image: postgres:13
    environment:
      POSTGRES_DB: staff_attendance_db
      POSTGRES_USER: staffapp
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    restart: unless-stopped

  backend:
    build: ./backend
    environment:
      - DATABASE_URL=postgresql://staffapp:${DB_PASSWORD}@db:5432/staff_attendance_db
      - SECRET_KEY=${SECRET_KEY}
    depends_on:
      - db
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    restart: unless-stopped

  frontend:
    build: ./frontend
    environment:
      - REACT_APP_API_URL=${API_URL}
    depends_on:
      - backend
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
```

### Kubernetes Deployment

#### 1. Backend Deployment
```yaml
# backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: staff-app-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: staff-app-backend
  template:
    metadata:
      labels:
        app: staff-app-backend
    spec:
      containers:
      - name: backend
        image: staff-app-backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: staff-app-secrets
              key: database-url
        - name: SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: staff-app-secrets
              key: secret-key
```

#### 2. Frontend Deployment
```yaml
# frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: staff-app-frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: staff-app-frontend
  template:
    metadata:
      labels:
        app: staff-app-frontend
    spec:
      containers:
      - name: frontend
        image: staff-app-frontend:latest
        ports:
        - containerPort: 3000
        env:
        - name: REACT_APP_API_URL
          value: "http://staff-app-backend-service:8000"
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Issues
```bash
# Check database status
sudo systemctl status postgresql

# Check connection
psql -h localhost -U staffapp -d staff_attendance_db

# Check logs
sudo tail -f /var/log/postgresql/postgresql-13-main.log
```

#### 2. Application Issues
```bash
# Check application status
sudo systemctl status staff-app

# Check logs
sudo journalctl -u staff-app -f

# Check application logs
tail -f /home/staffapp/staff-attendance-system/backend/logs/app.log
```

#### 3. Nginx Issues
```bash
# Check Nginx status
sudo systemctl status nginx

# Test configuration
sudo nginx -t

# Check logs
sudo tail -f /var/log/nginx/error.log
```

### Performance Issues

#### 1. Database Performance
```sql
-- Check slow queries
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check database size
SELECT pg_size_pretty(pg_database_size('staff_attendance_db'));

-- Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

#### 2. Application Performance
```bash
# Check memory usage
free -h

# Check CPU usage
top

# Check disk usage
df -h

# Check network connections
netstat -tulpn
```

### Recovery Procedures

#### 1. Database Recovery
```bash
# Restore from backup
gunzip -c /home/staffapp/backups/staff_db_20240115_020000.sql.gz | psql -h localhost -U staffapp -d staff_attendance_db

# Check database integrity
psql -h localhost -U staffapp -d staff_attendance_db -c "VACUUM ANALYZE;"
```

#### 2. Application Recovery
```bash
# Restore application from backup
cd /home/staffapp
tar -xzf backups/staff_app_20240115_020000.tar.gz

# Restart services
sudo systemctl restart staff-app
sudo systemctl restart nginx
```

## Maintenance

### Regular Maintenance Tasks

#### 1. Database Maintenance
```bash
# Weekly maintenance script
#!/bin/bash
# /home/staffapp/maintenance.sh

# Vacuum database
psql -h localhost -U staffapp -d staff_attendance_db -c "VACUUM ANALYZE;"

# Update statistics
psql -h localhost -U staffapp -d staff_attendance_db -c "ANALYZE;"

# Check for long-running queries
psql -h localhost -U staffapp -d staff_attendance_db -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query FROM pg_stat_activity WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';"
```

#### 2. Log Rotation
```bash
# Set up log rotation
sudo nano /etc/logrotate.d/staff-app
```
```
/home/staffapp/staff-attendance-system/backend/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 staffapp staffapp
    postrotate
        systemctl reload staff-app
    endscript
}
```

#### 3. Security Updates
```bash
# Automated security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades

# Configure automatic updates
sudo nano /etc/apt/apt.conf.d/50unattended-upgrades
```

### Monitoring and Alerting

#### 1. Health Checks
```bash
# Create health check script
#!/bin/bash
# /home/staffapp/health-check.sh

# Check database
if ! pg_isready -h localhost -U staffapp -d staff_attendance_db; then
    echo "Database is down"
    exit 1
fi

# Check application
if ! curl -f http://localhost:8000/health; then
    echo "Application is down"
    exit 1
fi

# Check disk space
if [ $(df /home/staffapp | awk 'NR==2 {print $5}' | sed 's/%//') -gt 90 ]; then
    echo "Disk space is low"
    exit 1
fi

echo "All systems healthy"
```

#### 2. Alerting
```bash
# Set up email alerts
sudo apt install mailutils

# Create alert script
#!/bin/bash
# /home/staffapp/alert.sh
if ! /home/staffapp/health-check.sh; then
    echo "Staff App is down" | mail -s "Staff App Alert" admin@company.com
fi
```

This deployment guide provides comprehensive instructions for deploying the Staff Attendance & Payout System in various environments. Follow the appropriate section based on your deployment needs and requirements.