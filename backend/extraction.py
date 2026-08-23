# pyrefly: ignore [missing-import]
import fitz  # PyMuPDF
# pyrefly: ignore [missing-import]
import pytesseract
# pyrefly: ignore [missing-import]
from PIL import Image
import io

# Ensure Tesseract is installed on the system path for image OCR
# Note: For Windows, you might need to specify pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extracts text from a PDF file using PyMuPDF."""
    text = ""
    try:
        # Open the PDF from bytes
        pdf_document = fitz.open(stream=file_bytes, filetype="pdf")
        for page_num in range(len(pdf_document)):
            page = pdf_document.load_page(page_num)
            text += page.get_text("text") + "\n"
        pdf_document.close()
        return text.strip()
    except Exception as e:
        raise Exception(f"Failed to parse PDF: {str(e)}")

def extract_text_from_image(file_bytes: bytes) -> str:
    """Extracts text from an Image file using Tesseract OCR."""
    try:
        # Open image from bytes
        image = Image.open(io.BytesIO(file_bytes))
        # Perform OCR
        text = pytesseract.image_to_string(image)
        return text.strip()
    except Exception as e:
        raise Exception(f"Failed to perform OCR on image: {str(e)}")
