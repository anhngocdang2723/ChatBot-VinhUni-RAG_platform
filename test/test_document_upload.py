"""
Test script for complete document processing pipeline:
1. Load PDF file
2. Extract text
3. Split into chunks
4. Upload to Pinecone (with auto-embedding)
5. Test query/chat

Also includes utility to delete vectors from Pinecone.
"""
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("="*70)
print("TEST: Document Processing Pipeline")
print("File: Cẩm nang sinh viên 2021")
print("="*70)

# Configuration
FILE_PATH = "data/file/cam_nang_hssv_nam_2021.pdf"
NAMESPACE = "cam_nang_2021"
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200

# Test 1: Check file exists
print("\n[1/7] Checking file...")
if not os.path.exists(FILE_PATH):
    print(f"❌ File not found: {FILE_PATH}")
    sys.exit(1)

file_size = os.path.getsize(FILE_PATH) / (1024 * 1024)  # MB
print(f"✅ File found: {FILE_PATH}")
print(f"   Size: {file_size:.2f} MB")

# Test 2: Check environment variables
print("\n[2/7] Checking environment variables...")
required_vars = ["PINECONE_API_KEY", "DASHSCOPE_API_KEY"]
for var in required_vars:
    value = os.getenv(var)
    if value:
        masked = f"{value[:8]}...{value[-4:]}" if len(value) > 12 else "***"
        print(f"  ✅ {var}: {masked}")
    else:
        print(f"  ❌ {var}: NOT SET")
        sys.exit(1)

print("\n✅ All required environment variables are set")

# Test 3: Import services
print("\n[3/7] Importing services...")
try:
    from core.pinecone.pinecone_service import PineconeService
    from core.llm.llm_interface import RAGPromptManager, create_llm_provider
    import fitz  # PyMuPDF
    
    # Simple text splitter (avoid complex imports)
    from langchain_text_splitters import RecursiveCharacterTextSplitter
    
    print("✅ Successfully imported all required modules")
except ImportError as e:
    print(f"❌ Failed to import: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test 4: Initialize services
print("\n[4/7] Initializing services...")
try:
    pinecone_api_key = os.getenv("PINECONE_API_KEY")
    dashscope_api_key = os.getenv("DASHSCOPE_API_KEY")
    
    if not pinecone_api_key or not dashscope_api_key:
        raise ValueError("Missing required API keys")
    
    # Pinecone service
    pinecone_service = PineconeService(
        api_key=pinecone_api_key,
        environment="us-east-1"
    )
    pinecone_service.setup_indexes()
    print("✅ Pinecone service initialized")
    
    # Text splitter
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP
    )
    print(f"✅ Text splitter initialized (size={CHUNK_SIZE}, overlap={CHUNK_OVERLAP})")
    
    # LLM service
    provider = create_llm_provider("qwen", dashscope_api_key)
    llm_service = RAGPromptManager(provider=provider)
    print("✅ Qwen LLM service initialized")
    
except Exception as e:
    print(f"❌ Failed to initialize services: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test 5: Extract and process document
print("\n[5/7] Processing document...")
try:
    # Extract text from PDF
    print("   📄 Extracting text from PDF...")
    text = ""
    with fitz.open(FILE_PATH) as doc:
        total_pages = len(doc)
        print(f"   Total pages: {total_pages}")
        
        for page_num, page in enumerate(doc, 1):
            page_text = page.get_text()
            text += page_text
            if page_num % 10 == 0:
                print(f"   Processed {page_num}/{total_pages} pages...")
    
    print(f"   ✅ Extracted {len(text)} characters from {total_pages} pages")
    
    # Split into chunks
    print("\n   ✂️  Splitting text into chunks...")
    chunks = text_splitter.split_text(text)
    print(f"   ✅ Split into {len(chunks)} chunks")
    
    # Show sample chunk
    if chunks:
        sample = chunks[0][:150] + "..." if len(chunks[0]) > 150 else chunks[0]
        print(f"\n   Sample chunk 1:")
        print(f"   {'-'*66}")
        print(f"   {sample}")
        print(f"   {'-'*66}")
    
except Exception as e:
    print(f"❌ Failed to process document: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test 6: Upload to Pinecone
print("\n[6/7] Uploading to Pinecone...")
print(f"   Namespace: {NAMESPACE}")

# Ask user if they want to delete existing data
print("\n   ⚠️  Do you want to delete existing vectors in this namespace first?")
print("   This will remove all previous uploads for this document.")
user_input = input("   Delete existing data? (y/N): ").strip().lower()

try:
    if user_input == 'y':
        print("\n   🗑️  Deleting existing vectors...")
        try:
            # Delete from dense index
            if pinecone_service.dense_index:
                pinecone_service.dense_index.delete(
                    namespace=NAMESPACE,
                    delete_all=True
                )
                print(f"   ✅ Deleted vectors from dense index")
            
            # Delete from sparse index
            if pinecone_service.sparse_index:
                pinecone_service.sparse_index.delete(
                    namespace=NAMESPACE,
                    delete_all=True
                )
                print(f"   ✅ Deleted vectors from sparse index")
            
            print("   Waiting 2 seconds for deletion to complete...")
            import time
            time.sleep(2)
        except Exception as delete_error:
            # Namespace might not exist yet
            if "not found" in str(delete_error).lower():
                print(f"   ℹ️  Namespace doesn't exist yet (will be created)")
            else:
                raise delete_error
    
    # Prepare documents for upload
    print("\n   📤 Preparing documents for upload...")
    documents = []
    for i, chunk in enumerate(chunks):
        doc_id = f"cam_nang_2021_chunk_{i}"
        documents.append({
            "id": doc_id,
            "chunk_text": chunk,  # Must be 'chunk_text' for Pinecone field mapping
            # Flat metadata structure (no nested dict)
            "source": "cam_nang_hssv_nam_2021.pdf",
            "document_type": "pdf",
            "chunk_index": i,  # Use int, not string
            "total_chunks": len(chunks),  # Use int
            "upload_date": "2025-10-08"
        })
    
    print(f"   Prepared {len(documents)} documents")
    
    # Upload to Pinecone
    print("\n   ⬆️  Uploading to Pinecone (this may take a while)...")
    pinecone_service.upsert_documents(
        documents=documents,
        namespace=NAMESPACE
    )
    
    print("\n   ✅ Upload complete!")
    print("   Waiting 3 seconds for indexing...")
    import time
    time.sleep(3)
    
    # Check index stats
    if pinecone_service.dense_index:
        stats = pinecone_service.dense_index.describe_index_stats()
        namespace_stats = stats.get('namespaces', {}).get(NAMESPACE, {})
        vector_count = namespace_stats.get('vector_count', 0)
        print(f"\n   📊 Index Statistics:")
        print(f"   - Namespace: {NAMESPACE}")
        print(f"   - Vectors: {vector_count}")
        print(f"   - Expected: {len(chunks)}")
        
        if vector_count == len(chunks):
            print("   ✅ All chunks uploaded successfully!")
        else:
            print(f"   ⚠️  Vector count mismatch (expected {len(chunks)}, got {vector_count})")
    
except Exception as e:
    print(f"❌ Failed to upload to Pinecone: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test 7: Test query/chat
print("\n[7/7] Testing RAG query...")
print("="*70)

test_queries = [
    "Cẩm nang sinh viên có những thông tin gì?",
    "Quy định về đào tạo tại Đại học Vinh",
    "Thông tin về ký túc xá"
]

try:
    for i, query in enumerate(test_queries, 1):
        print(f"\n📝 Query {i}: {query}")
        print("-" * 70)
        
        # Retrieve documents
        print("   🔍 Retrieving relevant chunks...")
        search_results = pinecone_service.hybrid_search(
            query=query,
            namespace=NAMESPACE,
            top_k=3
        )
        
        if not search_results:
            print("   ⚠️  No results found")
            continue
        
        print(f"   ✅ Found {len(search_results)} relevant chunks:")
        for j, result in enumerate(search_results, 1):
            score = result.get('_score', 0)
            fields = result.get('fields', {})
            text = fields.get('chunk_text', '')
            chunk_idx = fields.get('chunk_index', 'N/A')
            preview = text[:80] + "..." if len(text) > 80 else text
            print(f"      {j}. Chunk {chunk_idx} | Score: {score:.4f}")
            print(f"         {preview}")
        
        # Prepare documents for LLM
        documents = []
        for result in search_results:
            fields = result.get('fields', {})
            documents.append({
                'text': fields.get('chunk_text', ''),
                'metadata': {
                    'source': fields.get('source', 'unknown'),
                    'document_type': fields.get('document_type', 'pdf'),
                    'chunk_index': fields.get('chunk_index', 'N/A')
                },
                'score': result.get('_score', 0)
            })
        
        # Generate answer
        print("\n   🤖 Generating answer...")
        response = llm_service.generate_answer(
            query=query,
            documents=documents,
            temperature=0.7,
            max_tokens=400,
            model="qwen-turbo"
        )
        
        print("\n   ✅ Answer:")
        print("   " + "─" * 66)
        answer_lines = response['answer'].split('\n')
        for line in answer_lines:
            print(f"   {line}")
        print("   " + "─" * 66)
        
        print(f"\n   📚 Used {len(response['sources'])} source chunks")
        
except Exception as e:
    print(f"\n❌ Query test failed: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Summary
print("\n" + "="*70)
print("TEST SUMMARY")
print("="*70)
print("✅ File extraction: OK")
print("✅ Text splitting: OK")
print("✅ Pinecone upload: OK")
print("✅ Vector storage: OK")
print("✅ RAG query: OK")
print("\n🎉 Complete document pipeline working!")
print(f"\nDocument stored in namespace: '{NAMESPACE}'")
print("\nTo delete all vectors from this namespace, run:")
print(f"  pinecone_service.dense_index.delete(namespace='{NAMESPACE}', delete_all=True)")
print(f"  pinecone_service.sparse_index.delete(namespace='{NAMESPACE}', delete_all=True)")
print("="*70)
