from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import uvicorn
from typing import List, Dict, Any

# Import routers
from routers import document_router, query_router, document_manager
from core.config import Settings

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="RAG Chatbot API",
    description="API for RAG-based chatbot with multiple LLM provider support",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://6b91-2405-4802-4988-de10-85df-6076-7ece-9730.ngrok-free.app",  # Frontend ngrok URL
        "http://localhost:3000",  # Local development
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Create required directories
os.makedirs("data/uploads", exist_ok=True)
os.makedirs("output", exist_ok=True)

# Include routers
app.include_router(document_router.router, prefix="/api/documents", tags=["documents"])
app.include_router(query_router.router, prefix="/api/query", tags=["query"])
app.include_router(document_manager.router, prefix="/api/manage", tags=["management"])

# Add health check endpoint
@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

@app.get("/api")
async def root():
    return {"message": "API ready now"}

@app.get("/")
async def root():
    return {"message": "RAG Chatbot API is running"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 