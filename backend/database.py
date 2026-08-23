# pyrefly: ignore [missing-import]
from sqlalchemy import create_engine
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import declarative_base, sessionmaker
import os
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

load_dotenv()

# We expect a NEON_DATABASE_URL in the .env file. 
# For now, we fallback to a local sqlite db if not provided for testing purposes.
import urllib.parse
url = os.getenv('NEON_DATABASE_URL', 'sqlite:///./sql_app.db')
if url.startswith('postgresql://'):
    url = url.replace('postgresql://', 'postgresql+pg8000://', 1)
    # pg8000 doesn't accept sslmode/channel_binding kwargs from the URL string
    parsed = urllib.parse.urlparse(url)
    url = urllib.parse.urlunparse(parsed._replace(query=''))
SQLALCHEMY_DATABASE_URL = url

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


