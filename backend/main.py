# pyrefly: ignore [missing-import]
from fastapi import FastAPI

app = FastAPI(title="Document Summary Assistant API", version="1.0.0")

@app.get("/")
def read_root():
    return {"message": "Welcome to Document Summary Assistant API"}
