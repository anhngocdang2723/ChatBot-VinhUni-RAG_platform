"""
Setup script for Chatbot RAG with Pinecone
This script initializes the database and creates necessary directories
"""

import os
import sys

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.database.database import engine, Base
from core.database.models import Document, User
from core.llm.config import get_settings

def create_directories():
    """Create necessary directories"""
    settings = get_settings()
    
    directories = [
        "data",
        "data/uploads",
        "data/outputs",
        "data/temp"
    ]
    
    for directory in directories:
        if not os.path.exists(directory):
            os.makedirs(directory, exist_ok=True)
            print(f"✓ Created directory: {directory}")
        else:
            print(f"✓ Directory exists: {directory}")

def init_database():
    """Initialize SQLite database"""
    print("\n=== Initializing Database ===")
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("✓ Database tables created successfully!")
        
        # Print database location
        settings = get_settings()
        db_path = settings.DATABASE_URL.replace("sqlite:///", "")
        print(f"✓ Database location: {db_path}")
        
    except Exception as e:
        print(f"✗ Error creating database: {e}")
        return False
    
    return True

def check_environment():
    """Check if required environment variables are set"""
    print("\n=== Checking Environment Variables ===")
    settings = get_settings()
    
    required_vars = [
        ("PINECONE_API_KEY", settings.PINECONE_API_KEY),
        ("DASHSCOPE_API_KEY", settings.DASHSCOPE_API_KEY),
        ("SECRET_KEY", settings.SECRET_KEY),
    ]
    
    all_set = True
    for var_name, var_value in required_vars:
        if not var_value or var_value == f"your_{var_name.lower()}_here":
            print(f"✗ {var_name} not set or using default value")
            all_set = False
        else:
            # Mask API keys
            masked = var_value[:8] + "..." + var_value[-4:] if len(var_value) > 12 else "***"
            print(f"✓ {var_name} is set ({masked})")
    
    return all_set

def main():
    """Main setup function"""
    print("=" * 60)
    print("Chatbot RAG Setup - Pinecone + Qwen3-Max + SQLite")
    print("=" * 60)
    
    # Step 1: Create directories
    print("\n=== Step 1: Creating Directories ===")
    create_directories()
    
    # Step 2: Initialize database
    print("\n=== Step 2: Initializing Database ===")
    if not init_database():
        print("\n✗ Setup failed at database initialization")
        return False
    
    # Step 3: Check environment variables
    print("\n=== Step 3: Checking Environment ===")
    env_ok = check_environment()
    
    if not env_ok:
        print("\n⚠ Warning: Some environment variables are not set properly")
        print("Please create a .env file based on .env.example and set your API keys")
    
    print("\n" + "=" * 60)
    print("✓ Setup completed successfully!")
    print("=" * 60)
    
    print("\nNext steps:")
    print("1. Copy .env.example to .env and set your API keys")
    print("2. Run: uvicorn main:app --reload")
    print("3. Test document upload endpoint: POST /documents/upload")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
