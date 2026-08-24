from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from logger import setup_logger
logger = setup_logger(__name__)
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from extraction import extract_text_from_pdf, extract_text_from_image
from pydantic import BaseModel
from ai import generate_summary, chat_with_document\nfrom typing import List
import models
from database import engine, get_db
import os

logger.info("Initializing database schema..."); models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Document Summary Assistant API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to Document Summary Assistant API"}

@app.post("/upload")
async def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    content_type = file.content_type
    if not content_type:
        raise HTTPException(status_code=400, detail="Could not determine file type.")
    MAX_FILE_SIZE = 10 * 1024 * 1024
    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum size is 10MB.")

    # Security: Verify magic bytes (file signature) to prevent spoofing
    header = file_bytes[:8]
    is_pdf = header.startswith(b'%PDF-')
    is_jpeg = header.startswith(b'\xff\xd8\xff')
    is_png = header.startswith(b'\x89PNG\r\n\x1a\n')

    if not (is_pdf or is_jpeg or is_png):
        logger.warning(f"Malicious upload attempt rejected. Magic bytes: {header}")
        raise HTTPException(status_code=400, detail="Invalid file signature. File is not a valid PDF or Image.")

    try:

        extracted_text = ""
        if "pdf" in content_type.lower():
            extracted_text = await extract_text_from_pdf(file_bytes)
        elif "image" in content_type.lower():
            extracted_text = await extract_text_from_image(file_bytes)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type. Please upload a PDF or image.")
        if not extracted_text:
            raise HTTPException(status_code=400, detail="Could not extract any text from the file.")
        new_doc = models.Document(
            filename=file.filename,
            file_type=content_type,
            extracted_text=extracted_text,
            owner_id=None
        )
        db.add(new_doc)
        db.commit()
        db.refresh(new_doc)
        return {
            "document_id": new_doc.id,
            "filename": file.filename,
            "content_type": content_type,
            "text": extracted_text,
            "message": "File processed successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("An error occurred during file upload")
        raise HTTPException(status_code=500, detail="An error occurred during file processing. Please try again.")


class SummaryRequest(BaseModel):
    document_id: int
    text: str
    length: str = "medium"


@app.post("/summarize")
def summarize_document(request: SummaryRequest, db: Session = Depends(get_db)):
    if not request.text:
        raise HTTPException(status_code=400, detail="No text provided for summarization")
    doc = db.query(models.Document).filter(models.Document.id == request.document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found in database")
    try:
        summary_text = generate_summary(request.text, request.length)
        new_summary = models.Summary(
            document_id=doc.id,
            summary_length=request.length,
            content=summary_text
        )
        db.add(new_summary)
        db.commit()
        return {"summary": summary_text, "length": request.length}
    except Exception as e:
        logger.exception("An error occurred during AI summarization")
        raise HTTPException(status_code=500, detail=f"AI Error: {str(e)}")
\n
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    document_id: int
    message: str
    history: List[ChatMessage] = []

@app.post("/chat")
def chat_endpoint(request: ChatRequest, db: Session = Depends(get_db)):
    doc = db.query(models.Document).filter(models.Document.id == request.document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    try:
        history_dicts = [{"role": msg.role, "content": msg.content} for msg in request.history]
        response_text = chat_with_document(doc.extracted_text, request.message, history_dicts)
        return {"response": response_text}
    except Exception as e:
        logger.exception("An error occurred during chat")
        raise HTTPException(status_code=500, detail=f"AI Chat Error: {str(e)}")
