import os
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from dotenv import load_dotenv

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent"

SUMMARY_PROMPTS = {
    "short": "Summarize the following document in 3-5 bullet points focusing only on the most critical takeaways:\n\n{text}",
    "medium": "Provide a comprehensive summary of the following document. Include an introduction, key themes, and a conclusion:\n\n{text}",
    "long": "Provide an extremely detailed, section-by-section summary of the following document. Extract all important data, dates, and names:\n\n{text}",
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

