import os
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from dotenv import load_dotenv
import base64

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent"

SUMMARY_PROMPTS = {
    "concise": (
        "You are an executive assistant summarizing a document for a busy CEO. "
        "Extract ONLY the 3 most critical facts or decisions. "
        "Format as exactly 3 short bullet points. No introduction, no conclusion. "
        "Each bullet must be under 15 words.\\n\\n"
        "Document:\\n{text}"
    ),
    "medium": (
        "You are a professional analyst. Write a balanced overview of this document. "
        "Provide exactly three sections:\\n"
        "1. **Core Purpose**: One sentence explaining what this document is.\\n"
        "2. **Key Themes**: A brief paragraph summarizing the main arguments or points.\\n"
        "3. **Takeaways**: 3-4 bullet points of important details.\\n\\n"
        "Document:\\n{text}"
    ),
    "detailed": (
        "You are a meticulous researcher. Your job is to extract EVERY SINGLE piece of useful information from this document. "
        "Create a comprehensive, exhaustive outline. "
        "Do not leave out any names, dates, metrics, rules, or specific facts. "
        "If the document is short, break it down sentence by sentence. "
        "Use multiple nested markdown headings, bold text for key terms, and extensive bullet points.\\n\\n"
        "Document:\\n{text}"
    ),
    "short": "Summarize the following document in 3 short bullet points:\\n\\n{text}",
    "long": "Provide a comprehensive, section-by-section analysis:\\n\\n{text}",
}

def generate_summary(text: str, length: str = "medium") -> str:
    """Generates a summary by calling the Gemini REST API directly."""
    if not text:
        return ""

    prompt_template = SUMMARY_PROMPTS.get(length, SUMMARY_PROMPTS["medium"])
    prompt = prompt_template.format(text=text[:100000])

    session = requests.Session()
    retry = Retry(total=3, backoff_factor=1, status_forcelist=[429, 500, 502, 503, 504])
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("https://", adapter)
    session.mount("http://", adapter)

    headers = {
        "Content-Type": "application/json",
        "X-goog-api-key": GOOGLE_API_KEY,
    }

    # Dynamically set max tokens based on requested length
    max_tokens = 2048
    temperature = 0.3
    
    if length == "concise" or length == "short":
        max_tokens = 150
        temperature = 0.1
    elif length == "medium":
        max_tokens = 400
        temperature = 0.2
        
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "maxOutputTokens": max_tokens,
            "temperature": temperature
        }
    }

    try:
        response = session.post(GEMINI_URL, headers=headers, json=payload, timeout=60)
        response.raise_for_status()
        data = response.json()
        candidates = data.get("candidates", [])
        if not candidates:
            raise Exception("Gemini returned no candidates.")
        parts = candidates[0].get("content", {}).get("parts", [])
        if not parts:
            raise Exception("Gemini returned empty parts.")
        return parts[0].get("text", "")
    except requests.exceptions.HTTPError:
        raise Exception(f"Gemini API error {response.status_code}: {response.text}")
    except Exception as e:
        raise Exception(f"Failed to generate summary: {str(e)}")

def perform_ocr(image_bytes: bytes) -> str:
    """Extracts text from an image using Gemini Vision."""
    session = requests.Session()
    retry = Retry(total=3, backoff_factor=1, status_forcelist=[429, 500, 502, 503, 504])
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("https://", adapter)

    headers = {
        "Content-Type": "application/json",
        "X-goog-api-key": GOOGLE_API_KEY,
    }

    # Encode image to base64
    b64_img = base64.b64encode(image_bytes).decode('utf-8')

    payload = {
        "contents": [{
            "parts": [
                {"text": "Please extract all the text from this image exactly as written. Do not add any extra commentary."},
                {
                    "inlineData": {
                        "mimeType": "image/jpeg",
                        "data": b64_img
                    }
                }
            ]
        }]
    }

    try:
        response = session.post(GEMINI_URL, headers=headers, json=payload, timeout=60)
        response.raise_for_status()
        data = response.json()
        candidates = data.get("candidates", [])
        if not candidates:
            raise Exception("Gemini returned no candidates for OCR.")
        parts = candidates[0].get("content", {}).get("parts", [])
        if not parts:
            raise Exception("Gemini returned empty parts for OCR.")
        return parts[0].get("text", "").strip()
    except Exception as e:
        raise Exception(f"Gemini OCR failed: {str(e)}")
