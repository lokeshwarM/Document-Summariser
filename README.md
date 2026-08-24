# Document Summary Assistant

![Banner](https://via.placeholder.com/1200x300.png?text=Document+Summary+Assistant)

Document Summary Assistant is a robust, full-stack application built for high-performance text extraction and AI-powered summarization of PDFs and Images. 

This project was built to demonstrate engineering maturity, emphasizing a modern tech stack, scalable architecture, robust error handling, and production-ready CI/CD pipelines.

## 🚀 Key Features

* **Multi-Format Extraction:** Upload PDFs or images (PNG/JPEG) seamlessly.
* **Next-Gen OCR:** Bypasses traditional, error-prone local OCR binaries (like Tesseract) by utilizing the highly robust **Gemini 3.5 Vision API** for pixel-perfect text extraction, even from messy handwriting or complex document layouts.
* **Intelligent Summarization:** Generates context-aware summaries at varying depths (Short, Medium, Detailed).
* **Sleek UI/UX:** A responsive, single-column workflow with dynamic tabbed results, built with Next.js and Tailwind CSS.
* **Enterprise Reliability:** Comprehensive error handling, Python logging, database connection pooling, and continuous integration pipelines.

## 🛠 Tech Stack

### Frontend
* **Framework:** Next.js 14 (App Router)
* **Styling:** Tailwind CSS + Typography (@tailwindcss/typography)
* **State Management:** Zustand
* **Icons:** Lucide React
* **Notifications:** React Hot Toast

### Backend
* **Framework:** FastAPI
* **Database:** Serverless PostgreSQL (Neon) via SQLAlchemy + pg8000 (Python-native driver for maximum cross-platform compatibility).
* **AI Provider:** Google Gemini API (Vision Multimodal + Text endpoints)
* **Testing:** Pytest + Pytest-Mock

## 🧠 Architectural Highlights

See [ARCHITECTURE.md](ARCHITECTURE.md) for a deep dive into the system design, including why we chose Gemini Vision over local Tesseract.

## 💻 Getting Started

### Prerequisites
* Node.js (v20+)
* Python (3.10+)
* Google Gemini API Key
* Neon PostgreSQL Database URL (or local SQLite)

### 1. Clone the repository
`ash
git clone https://github.com/lokeshwarM/Document-Summariser.git
cd Document-Summariser
`

### 2. Backend Setup
`ash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use env\Scripts\activate
pip install -r requirements.txt
`
Create a .env file in the ackend/ directory:
`env
GEMINI_API_KEY=your_gemini_api_key
NEON_DATABASE_URL=postgresql://user:password@host/db
`
Start the backend server:
`ash
python -m uvicorn main:app --reload
`

### 3. Frontend Setup
`ash
cd frontend
npm install
npm run dev
`
Open http://localhost:3000 in your browser.

## 🧪 Testing

The backend includes a comprehensive pytest suite for the API endpoints and extraction logic.

`ash
cd backend
pytest test_main.py
`

## 🔄 CI/CD Pipeline

This project includes a fully configured GitHub Actions workflow (.github/workflows/ci.yml) that automatically runs the backend test suite and verifies the frontend build on every push to the main branch.

## 📝 License
MIT License
