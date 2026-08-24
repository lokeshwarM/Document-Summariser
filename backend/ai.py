import os
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from dotenv import load_dotenv

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent"

SUMMARY_PROMPTS = {
    # Concise: strict 80-120 word bullet-point summary
    "concise": (
        "You are a precise document summarizer. Your task: summarize the document below in EXACTLY 3 to 5 bullet points. "
        "Each bullet must be a single, punchy sentence capturing only the most critical insight. "
        "STRICT RULE: Your entire response must be under 120 words. Do NOT write any introduction or conclusion sentence. "
        "Start directly with the first bullet point.\n\n"
        "Document:\n{text}"
    ),
    # Medium: 250-350 word balanced overview
    "medium": (
        "You are a professional document analyst. Write a balanced summary of the document below. "
        "Structure it with: a 1-sentence introduction, 3-4 key themes as short paragraphs, and a 1-sentence conclusion. "
        "STRICT RULE: Your entire response must be between 250 and 350 words. "
        "Use clear section labels (e.g., **Introduction**, **Key Themes**, **Conclusion**).\n\n"
        "Document:\n{text}"
    ),
    # Detailed: 600+ word comprehensive section-by-section analysis
    "detailed": (
        "You are a senior research analyst. Write a comprehensive, section-by-section analysis of the document below. "
        "For every distinct topic or section in the document, write a dedicated heading and at least 2-3 detailed paragraphs. "
        "Include all key data points, names, dates, and specific details mentioned. "
        "STRICT RULE: Your response must be AT LEAST 600 words. Do not truncate or skip any section.\n\n"
        "Document:\n{text}"
    ),
    # Aliases for backward compatibility
    "short": (
        "Summarize the following document in 3-5 bullet points focusing only on the most critical takeaways. "
        "Keep it under 120 words total:\n\n{text}"
    ),
    "long": (
        "Provide an extremely detailed, section-by-section summary (at least 600 words) of the following document. "
        "Extract all important data, dates, and names:\n\n{text}"
    ),
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

    payload = {
        "contents": [{"parts": [{"text": prompt}]}]
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


import base64

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
