from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# We expect a NEON_DATABASE_URL in the .env file. 
# For now, we fallback to a local sqlite db if not provided for testing purposes.
SQLALCHEMY_DATABASE_URL = os.getenv("NEON_DATABASE_URL", "sqlite:///./sql_app.db")

# Neon/Postgres specific arguments
connect_args = {}
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args=connect_args
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
