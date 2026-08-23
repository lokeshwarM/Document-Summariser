import os
# pyrefly: ignore [missing-import]
import google.generativeai as genai
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini with the API key
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# Use the stable available Gemini model
MODEL_NAME = "gemini-2.0-flash"

SUMMARY_PROMPTS = {
    "short": "Summarize the following document in 3-5 bullet points focusing only on the most critical takeaways:\n\n{text}",
    "medium": "Provide a comprehensive summary of the following document. Include an introduction, key themes, and a conclusion:\n\n{text}",
    "long": "Provide an extremely detailed, section-by-section summary of the following document. Extract all important data, dates, and names:\n\n{text}",
}

def generate_summary(text: str, length: str = "medium") -> str:
    """Generates a summary using the Google Gemini API directly."""
    if not text:
        return ""

    prompt_template = SUMMARY_PROMPTS.get(length, SUMMARY_PROMPTS["medium"])
    prompt = prompt_template.format(text=text[:100000])

    try:
        model = genai.GenerativeModel(MODEL_NAME)
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        raise Exception(f"Failed to generate summary: {str(e)}")
