import pypdf
import pytesseract
from PIL import Image
import io
import asyncio

async def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extracts text from a PDF file using pypdf."""
    def _parse():
        text = ""
        pdf_reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        for page in pdf_reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
        return text.strip()
    try:
        return await asyncio.to_thread(_parse)
    except Exception as e:
        raise Exception(f"Failed to parse PDF: {str(e)}")

async def extract_text_from_image(file_bytes: bytes) -> str:
    """Extracts text from an Image file using Tesseract OCR asynchronously."""
    def _ocr():
        image = Image.open(io.BytesIO(file_bytes))
        return pytesseract.image_to_string(image).strip()
    try:
        return await asyncio.to_thread(_ocr)
    except Exception as e:
        raise Exception(f"Failed to perform OCR on image: {str(e)}")
