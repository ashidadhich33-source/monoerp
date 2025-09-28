#!/usr/bin/env python3
import sys
import os
sys.path.append('.')

from main import app
import uvicorn

if __name__ == "__main__":
    print("Starting Staff Attendance & Payout System Backend...")
    print("Server will be available at: http://localhost:8000")
    print("API Documentation: http://localhost:8000/docs")
    print("Health Check: http://localhost:8000/health")
    print("=" * 50)
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000, 
        log_level="info",
        access_log=True
    )