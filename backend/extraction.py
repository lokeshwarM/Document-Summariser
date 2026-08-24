import pypdf
from PIL import Image
import io
import asyncio
from logger import setup_logger

logger = setup_logger(__name__)
from ai import perform_ocr
import re

def clean_extracted_text(text: str) -> str:
    """Removes weird single line breaks to form proper paragraphs."""
    # Replace single line breaks with spaces, but keep double line breaks (paragraphs)
    text = re.sub(r'(?<!\n)\n(?!\n)', ' ', text)
    # Strip excessive whitespace
    text = re.sub(r' +', ' ', text)
    return text.strip()

async def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extracts text from a PDF file using pypdf."""
    def _parse():
        text = ""
        pdf_reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        for page in pdf_reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
        return clean_extracted_text(text)
    try:
        return await asyncio.to_thread(_parse)
    except Exception as e:
        logger.error(f"PDF Extraction Error: {str(e)}"); raise Exception(f"Failed to parse PDF: {str(e)}")

async def extract_text_from_image(file_bytes: bytes) -> str:
    """Extracts text from an Image file using Gemini OCR asynchronously."""
    def _ocr():
        # Convert to JPEG bytes to ensure compatibility and reduce size
        image = Image.open(io.BytesIO(file_bytes))
        if image.mode in ('RGBA', 'P'):
            image = image.convert('RGB')
        img_byte_arr = io.BytesIO()
        image.save(img_byte_arr, format='JPEG', quality=85)
        
        return clean_extracted_text(perform_ocr(img_byte_arr.getvalue()))
        
    try:
        return await asyncio.to_thread(_ocr)
    except Exception as e:
        logger.error(f"OCR Error: {str(e)}"); raise Exception(f"Failed to perform OCR on image: {str(e)}")
