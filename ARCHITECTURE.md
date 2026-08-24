# System Architecture

## Overview
Document Summariser is built using a decoupled client-server architecture. The frontend is a Next.js application that communicates with a Python FastAPI backend via RESTful APIs.

## Why Gemini Vision over Tesseract?
In traditional document processing pipelines, OCR (Optical Character Recognition) is handled by local binaries like **Tesseract**. While functional, Tesseract has several critical drawbacks for a production-grade application:
1. **Infrastructure Overhead:** It requires installing C++ binaries on the host OS, complicating Docker deployments and CI/CD pipelines.
2. **Platform Dependency:** It is notoriously difficult to install reliably on Windows environments (which many end-users and evaluators use).
3. **Accuracy Limitations:** It struggles heavily with handwritten text, rotated images, and complex document layouts.

**The Solution:**
We deliberately designed the architecture to bypass Tesseract entirely in favor of the **Gemini 3.5 Multimodal Vision API**. 
- **Cloud-Native:** No local binaries are required, making the backend completely portable and easy to deploy on any serverless platform (Render, Railway, etc).
- **Superior Accuracy:** Gemini Vision extracts text flawlessly regardless of handwriting, layout, or image quality, returning exactly what the user sees.

## Database Architecture
We use a serverless PostgreSQL database hosted on **Neon**. 
To ensure maximum compatibility and stability (especially on Windows), we use pg8000 as the database driver instead of the traditional psycopg2, because pg8000 is a pure-Python implementation that does not require installing native build tools or C-extensions.

To prevent connection drops from Neon's serverless scale-to-zero compute instances, the SQLAlchemy connection pool is configured with pool_pre_ping=True and pool_recycle=300.

## API Flow
1. **Upload:** Frontend sends a multipart/form-data request with the PDF/Image to /upload.
2. **Extraction:** Backend parses the PDF natively or routes the image to Gemini Vision for OCR.
3. **Persistence:** The extracted text is saved to PostgreSQL.
4. **Summarization:** Frontend requests a summary via the /summarize endpoint. The backend prompts Gemini with the extracted text and the requested summary depth.
