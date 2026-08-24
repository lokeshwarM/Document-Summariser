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
        "TASK: Provide a CONCISE summary of the document.\n"
        "CONSTRAINTS:\n"
        "- MUST be EXACTLY 3-5 short bullet points.\n"
        "- MUST use bold markdown (`**bold**`) for key terms and entity names.\n"
        "- NO introduction, NO conversational text, NO conclusion.\n"
        "- Just the bolded bullet points.\n"
        "- Keep it under 50 words total.\n\n"
        "DOCUMENT TEXT:\n{text}"
    ),
    "medium": (
        "TASK: Provide a MEDIUM, balanced comprehensive summary of the document.\n"
        "CONSTRAINTS:\n"
        "- DO NOT write a wall of text.\n"
        "- MUST use rich markdown formatting (bullet points, **bold text** for important keywords).\n"
        "- MUST include a short Introduction paragraph.\n"
        "- MUST include a 'Key Themes' section utilizing bullet points.\n"
        "- MUST include a brief 'Conclusion' paragraph.\n"
        "- Keep it around 200 words.\n\n"
        "DOCUMENT TEXT:\n{text}"
    ),
    "detailed": (
        "TASK: Provide a DETAILED, section-by-section exhaustive summary of the document.\n"
        "CONSTRAINTS:\n"
        "- MUST extract every single important detail, metric, and name.\n"
        "- MUST use nested markdown headings (H2, H3), bullet points, and **bold text**.\n"
        "- MUST be very long and thorough.\n\n"
        "DOCUMENT TEXT:\n{text}"
    )
}

def generate_summary(text: str, length: str = "medium") -> str:
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

    system_instruction = (
        "You are an expert document summarizer. You MUST strictly obey the user's length and format constraints. "
        "Never include conversational filler like 'Here is a summary'."
    )
    
    payload = {
        "systemInstruction": {
            "parts": [{"text": system_instruction}]
        },
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.1 if length == "concise" else 0.3
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

def chat_with_document(document_text: str, message: str, history: list) -> str:
    if not document_text:
        return "Error: No document context."

    session = requests.Session()
    retry = Retry(total=3, backoff_factor=1, status_forcelist=[429, 500, 502, 503, 504])
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("https://", adapter)
    
    headers = {
        "Content-Type": "application/json",
        "X-goog-api-key": GOOGLE_API_KEY,
    }

    system_instruction = (
        "You are an expert document assistant. You MUST answer the user's questions strictly based on the provided document text. "
        "Use markdown formatting (bolding, lists) to make your answers clear and readable.\n\n"
        f"--- DOCUMENT TEXT ---\n{document_text[:100000]}\n--- END DOCUMENT TEXT ---"
    )

    contents = []
    for msg in history:
        contents.append({
            "role": msg.get("role", "user"),
            "parts": [{"text": msg.get("content", "")}]
        })
    
    contents.append({
        "role": "user",
        "parts": [{"text": message}]
    })

    payload = {
        "systemInstruction": {
            "parts": [{"text": system_instruction}]
        },
        "contents": contents,
        "generationConfig": {
            "temperature": 0.2
        }
    }

    try:
        response = session.post(GEMINI_URL, headers=headers, json=payload, timeout=60)
        response.raise_for_status()
        data = response.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as e:
        raise Exception(f"Chat failed: {str(e)}")

def perform_ocr(image_bytes: bytes) -> str:
    session = requests.Session()
    retry = Retry(total=3, backoff_factor=1, status_forcelist=[429, 500, 502, 503, 504])
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("https://", adapter)

    headers = {
        "Content-Type": "application/json",
        "X-goog-api-key": GOOGLE_API_KEY,
    }

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
