import os
# pyrefly: ignore [missing-import]
from langchain_google_genai import ChatGoogleGenerativeAI
# pyrefly: ignore [missing-import]
from langchain_core.prompts import PromptTemplate
# pyrefly: ignore [missing-import]
from langchain_core.output_parsers import StrOutputParser
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

load_dotenv()

# Initialize Gemini LLM — reads GOOGLE_API_KEY from .env
llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0.3)

# Define prompt templates for different summary lengths
SUMMARY_PROMPTS = {
    "short": "Summarize the following document in 3-5 bullet points focusing only on the most critical takeaways:\n\n{text}",
    "medium": "Provide a comprehensive summary of the following document. Include an introduction, key themes, and a conclusion:\n\n{text}",
    "long": "Provide an extremely detailed, section-by-section summary of the following document. Extract all important data, dates, and names:\n\n{text}"
}

def generate_summary(text: str, length: str = "medium") -> str:
    """Generates a summary of the provided text using LangChain and Gemini."""
    if not text:
        return ""

    prompt_str = SUMMARY_PROMPTS.get(length, SUMMARY_PROMPTS["medium"])
    prompt = PromptTemplate(input_variables=["text"], template=prompt_str)

    # Use the modern LangChain Expression Language (LCEL) pipe syntax
    chain = prompt | llm | StrOutputParser()

    try:
        response = chain.invoke({"text": text[:100000]})
        return response
    except Exception as e:
        raise Exception(f"Failed to generate summary: {str(e)}")
