import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from dotenv import load_dotenv

load_dotenv()

# Initialize Gemini LLM
# Expects GOOGLE_API_KEY in environment variables
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
    
    chain = LLMChain(llm=llm, prompt=prompt)
    
    try:
        response = chain.run(text=text[:100000]) # Basic protection against massive texts
        return response
    except Exception as e:
        raise Exception(f"Failed to generate summary: {str(e)}")
