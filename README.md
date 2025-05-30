# RAG Chatbot Platform

A sophisticated FastAPI-based Retrieval-Augmented Generation (RAG) chatbot platform that enhances document interaction through intelligent storage, retrieval, and question-answering capabilities.

## 🌟 Key Features

### Document Management
- **Vector Database Integration**: Efficient document storage and retrieval using vector embeddings
- **Collection Management**: 
  - Create and manage multiple document collections
  - Seamless switching between collections
  - Collection deletion and maintenance
- **Document Processing**: Automatic text extraction and vectorization

### Advanced Query Processing
- **RAG-Enhanced Q&A**: 
  - Intelligent question answering using context from stored documents
  - Dynamic context retrieval and reranking
  - Configurable relevance parameters
- **Smart Retrieval**:
  - Semantic search capabilities
  - Context-aware document fetching
  - Customizable similarity thresholds

### System Features
- **API-First Design**: RESTful endpoints for all functionalities
- **Scalable Architecture**: Built for performance and growth
- **Real-time Processing**: Quick response times for queries
- **Configurable Parameters**: Flexible system settings

## 🚀 Getting Started

### Prerequisites
- Python 3.8 or higher
- pip package manager
- Virtual environment (recommended)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/Chatbot-RAG.git
   cd Chatbot-RAG
   ```

2. Set up a virtual environment:
   ```bash
   python -m venv venv
   
   # On Windows:
   .\venv\Scripts\activate
   
   # On Unix or MacOS:
   source venv/bin/activate
   ```

3. Install required packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   Create a `.env` file in the root directory with:
   ```env
   QDRANT_API_KEY=your_qdrant_api_key
   LLM_API_KEY=your_llm_api_key
   QDRANT_HOST=your_qdrant_host  # Optional, defaults to localhost
   QDRANT_PORT=your_qdrant_port  # Optional, defaults to 6333
   ```

## 🔧 Running the Platform

### Development Server
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Production Server
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

Access the platform at: `http://localhost:8000`

## 📚 API Documentation

### Interactive Documentation
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Core Endpoints

#### Document Operations
```
POST    /documents/store              - Store new documents
GET     /documents/collections        - List all collections
POST    /documents/collections/{name} - Switch collection
DELETE  /documents/collections/{name} - Remove collection
```

#### Query Operations
```
POST    /query/rag      - RAG-based Q&A
POST    /query/retrieve - Document retrieval
GET     /query/history  - View query history
```

## 📁 Project Structure
```
.
├── main.py                 # Application entry point
├── core/
│   ├── config.py          # Configuration settings
│   ├── dependencies.py    # Dependency injection
│   └── utils.py          # Utility functions
├── models/
│   ├── document.py       # Document models
│   └── query.py         # Query models
├── services/
│   ├── vector_store.py   # Vector database operations
│   ├── document_processor.py # Document processing
│   └── query_engine.py   # Query processing
├── routers/
│   ├── document_router.py # Document endpoints
│   └── query_router.py    # Query endpoints
├── tests/                 # Test suite
└── requirements.txt       # Dependencies
```

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments
- FastAPI framework
- Qdrant vector database
- Transformers library
- All contributors and supporters

## 📞 Support
For support, please open an issue in the GitHub repository or contact the maintainers.