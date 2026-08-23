import os
import requests
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
# Use the REST endpoint and model exactly as shown in Google's cURL quickstart
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent"

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

    headers = {
        "Content-Type": "application/json",
        "X-goog-api-key": GOOGLE_API_KEY,
    }

    payload = {
        "contents": [
            {
                "parts": [{"text": prompt}]
            }
        ]
    }

    try:
        response = requests.post(GEMINI_URL, headers=headers, json=payload, timeout=60)
        response.raise_for_status()
        data = response.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except requests.exceptions.HTTPError as e:
        raise Exception(f"Gemini API error {response.status_code}: {response.text}")
    except Exception as e:
        raise Exception(f"Failed to generate summary: {str(e)}")
