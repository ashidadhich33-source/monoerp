from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError
from app.config.settings import get_settings
import logging

logger = logging.getLogger(__name__)
settings = get_settings()

# Create database engine with proper error handling
try:
    engine = create_engine(
        settings.database_url,
        echo=settings.debug,
        pool_pre_ping=True,  # Verify connections before use
        pool_recycle=3600,   # Recycle connections every hour
        connect_args={"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
    )
    logger.info("Database engine created successfully")
except Exception as e:
    logger.error(f"Failed to create database engine: {e}")
    raise

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for models
Base = declarative_base()

def get_db():
    """Dependency to get database session with proper error handling"""
    db = SessionLocal()
    try:
        # Test the connection
        db.execute("SELECT 1")
        yield db
    except SQLAlchemyError as e:
        logger.error(f"Database connection error: {e}")
        db.rollback()
        raise
    except Exception as e:
        logger.error(f"Unexpected database error: {e}")
        db.rollback()
        raise
    finally:
        db.close()