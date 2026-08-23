# pyrefly: ignore [missing-import]
from fastapi import FastAPI, UploadFile, File, HTTPException
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
from .extraction import extract_text_from_pdf, extract_text_from_image

app = FastAPI(title="Document Summary Assistant API", version="1.0.0")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to Document Summary Assistant API"}

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    # Read file bytes once
    file_bytes = await file.read()
    content_type = file.content_type
    
    try:
        extracted_text = ""
        if "pdf" in content_type.lower():
            extracted_text = extract_text_from_pdf(file_bytes)
        elif "image" in content_type.lower():
            extracted_text = extract_text_from_image(file_bytes)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type. Please upload a PDF or Image.")
            
        if not extracted_text:
            raise HTTPException(status_code=400, detail="Could not extract any text from the file.")
            
        return {
            "filename": file.filename,
            "content_type": content_type,
            "text": extracted_text,
            "message": "File processed successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# pyrefly: ignore [missing-import]
from pydantic import BaseModel
from .ai import generate_summary

class SummaryRequest(BaseModel):
    text: str
    length: str = "medium"

@app.post("/summarize")
def summarize_document(request: SummaryRequest):
    if not request.text:
        raise HTTPException(status_code=400, detail="No text provided for summarization")
        
    try:
        summary = generate_summary(request.text, request.length)
        return {
            "summary": summary,
            "length": request.length
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

