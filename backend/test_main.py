import pytest
from fastapi.testclient import TestClient
from main import app, get_db
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base
import io

# Setup test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

def test_health_check():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to Document Summary Assistant API"}

def test_upload_invalid_file_type():
    file_content = b"This is a fake text file."
    response = client.post(
        "/upload",
        files={"file": ("test.txt", io.BytesIO(file_content), "text/plain")}
    )
    assert response.status_code == 400
    assert "Invalid file signature" in response.json()["detail"]

def test_upload_valid_pdf_mocked(mocker):
    # We mock the extraction function so we don't need real OCR or PDF parsers in unit tests
    mocker.patch("main.extract_text_from_pdf", return_value="Mock extracted PDF text")
    
    file_content = b"%PDF-1.4 mock content"
    response = client.post(
        "/upload",
        files={"file": ("test.pdf", io.BytesIO(file_content), "application/pdf")}
    )
    assert response.status_code == 200
    data = response.json()
    assert "document_id" in data
    assert data["text"] == "Mock extracted PDF text"

def test_summarize_mocked(mocker):
    # First mock upload
    mocker.patch("main.extract_text_from_pdf", return_value="Mock extracted PDF text")
    file_content = b"%PDF-1.4 mock content"
    upload_res = client.post(
        "/upload",
        files={"file": ("test.pdf", io.BytesIO(file_content), "application/pdf")}
    )
    doc_id = upload_res.json()["document_id"]
    
    # Then mock summarize
    mocker.patch("main.generate_summary", return_value="Mock summary")
    response = client.post(
        "/summarize",
        json={"document_id": doc_id, "text": "Mock extracted PDF text", "summary_length": "short"}
    )
    
    assert response.status_code == 200
    assert response.json()["summary"] == "Mock summary"

def test_upload_spoofed_content_type():
    """Simulate a malicious user trying to upload an executable disguised as a PDF"""
    file_content = b"MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff\x00\x00\xb8\x00\x00\x00" # Windows EXE magic bytes
    response = client.post(
        "/upload",
        files={"file": ("malicious.pdf", io.BytesIO(file_content), "application/pdf")}
    )
    assert response.status_code == 400
    assert "Invalid file signature" in response.json()["detail"]

def test_upload_file_too_large():
    """Simulate a file larger than 10MB being rejected"""
    # Create 11MB of dummy data
    file_content = b"0" * (11 * 1024 * 1024)
    response = client.post(
        "/upload",
        files={"file": ("toolarge.pdf", io.BytesIO(file_content), "application/pdf")}
    )
    assert response.status_code == 413
    assert "File too large" in response.json()["detail"]
