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
from logger import setup_logger

logger = setup_logger(__name__)
import urllib.parse
import ssl
url = os.getenv('NEON_DATABASE_URL')
if not url:
    url = 'sqlite:///./sql_app.db'

connect_args = {}
if url.startswith('postgresql://'):
    url = url.replace('postgresql://', 'postgresql+pg8000://', 1)
    parsed = urllib.parse.urlparse(url)
    url = urllib.parse.urlunparse(parsed._replace(query=''))
    # Neon requires SSL, pg8000 needs an explicit ssl_context
    connect_args['ssl_context'] = ssl.create_default_context()
    
SQLALCHEMY_DATABASE_URL = url

if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}; logger.info("Using local SQLite database")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args=connect_args,
    pool_pre_ping=True,  # Automatically tests connection before using it
    pool_recycle=300     # Recycle connections older than 5 minutes
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



