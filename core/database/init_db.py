from .database import Base, engine
from .models import Document, User

def init_database():
    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

if __name__ == "__main__":
    init_database() 