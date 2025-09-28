#!/bin/bash

# Staff Attendance & Payout System Setup Script
echo "Setting up Staff Attendance & Payout System..."

# Create necessary directories
echo "Creating directories..."
mkdir -p backend/uploads
mkdir -p backend/backups
mkdir -p frontend/build

# Set permissions
chmod 755 backend/uploads
chmod 755 backend/backups

# Backend setup
echo "Setting up backend..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install Python dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Create database tables
echo "Creating database tables..."
python -c "from app.models.base import engine, Base; Base.metadata.create_all(bind=engine)"

echo "Backend setup complete!"

# Frontend setup
echo "Setting up frontend..."
cd ../frontend

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm install

# Build frontend
echo "Building frontend..."
npm run build

echo "Frontend setup complete!"

# Create startup scripts
echo "Creating startup scripts..."

# Backend startup script
cat > ../start_backend.sh << 'EOF'
#!/bin/bash
cd backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
EOF

# Frontend startup script
cat > ../start_frontend.sh << 'EOF'
#!/bin/bash
cd frontend
npm start
EOF

# Make scripts executable
chmod +x ../start_backend.sh
chmod +x ../start_frontend.sh

echo "Setup complete!"
echo ""
echo "To start the system:"
echo "1. Start backend: ./start_backend.sh"
echo "2. Start frontend: ./start_frontend.sh"
echo ""
echo "The system will be available at:"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://localhost:8000"
echo "- API Documentation: http://localhost:8000/docs"
echo ""
echo "Default admin credentials:"
echo "- Employee Code: admin"
echo "- Password: changeMe123"