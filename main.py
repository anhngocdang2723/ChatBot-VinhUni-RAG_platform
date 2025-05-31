import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import uvicorn
from typing import List, Dict, Any
from core.llm.config import Settings, get_settings
from core.auth import auth_router
from core.document_processing.model_singleton import model_singleton

# Import routers
from routers import document_router, query_router, document_manager

# Load environment variables
load_dotenv()

# Get settings
settings = get_settings()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize models at startup
logger.info("Initializing models...")
_ = model_singleton.embedding_model  # Initialize embedding model
_ = model_singleton.reranking_model  # Initialize reranking model
logger.info("Models initialization complete")

# Initialize FastAPI app
app = FastAPI(
    title=settings.API_TITLE,
    description=settings.API_DESCRIPTION
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://chatbot-vinhuni.vercel.app"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Create required directories
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.OUTPUT_DIR, exist_ok=True)

# Include routers
app.include_router(document_router.router, prefix="/api/documents", tags=["documents"])
app.include_router(query_router.router, prefix="/api/query", tags=["query"])
app.include_router(document_manager.router, prefix="/api/manage", tags=["management"])
app.include_router(auth_router.router, prefix="/api/auth", tags=["auth"])

# Add health check endpoint
@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "collection": {
            "name": settings.STORAGE_NAME,
            "display_name": settings.DISPLAY_NAME,
            "description": settings.DESCRIPTION
        }
    }

@app.get("/api")
async def root():
    return {"message": "API ready now"}

@app.get("/")
async def root():
    return {"message": "RAG Chatbot API is running"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 