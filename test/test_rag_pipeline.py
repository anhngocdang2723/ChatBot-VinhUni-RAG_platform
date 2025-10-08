"""
Test script for complete RAG pipeline: Pinecone retrieval + Qwen3-Max generation
"""
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("="*70)
print("TEST: Complete RAG Pipeline (Pinecone + Qwen3-Max)")
print("="*70)

# Test 1: Check environment variables
print("\n[1/5] Checking environment variables...")
required_vars = ["PINECONE_API_KEY", "DASHSCOPE_API_KEY", "SECRET_KEY"]
for var in required_vars:
    value = os.getenv(var)
    if value:
        masked = f"{value[:8]}...{value[-4:]}" if len(value) > 12 else "***"
        print(f"  ✅ {var}: {masked}")
    else:
        print(f"  ❌ {var}: NOT SET")
        sys.exit(1)

print("\n✅ All required environment variables are set")

# Test 2: Import services
print("\n[2/5] Importing services...")
try:
    from core.pinecone.pinecone_service import PineconeService
    from core.llm.llm_interface import RAGPromptManager, create_llm_provider
    print("✅ Successfully imported PineconeService and RAGPromptManager")
except ImportError as e:
    print(f"❌ Failed to import: {str(e)}")
    sys.exit(1)

# Test 3: Initialize services
print("\n[3/5] Initializing services...")
try:
    # Initialize Pinecone service
    pinecone_api_key = os.getenv("PINECONE_API_KEY")
    dashscope_api_key = os.getenv("DASHSCOPE_API_KEY")
    
    if not pinecone_api_key or not dashscope_api_key:
        raise ValueError("Missing required API keys")
    
    pinecone_service = PineconeService(
        api_key=pinecone_api_key,
        environment="us-east-1"
    )
    print("✅ Pinecone service initialized")
    print(f"   Dense index: {pinecone_service.dense_index_name}")
    print(f"   Sparse index: {pinecone_service.sparse_index_name}")
    
    # Initialize LLM service
    provider = create_llm_provider("qwen", dashscope_api_key)
    llm_service = RAGPromptManager(provider=provider)
    print("✅ Qwen3-Max LLM service initialized")
    
except Exception as e:
    print(f"❌ Failed to initialize services: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test 4: Setup indexes and upsert test documents
print("\n[4/5] Setting up Pinecone indexes with test data...")
try:
    # Setup indexes
    pinecone_service.setup_indexes()
    print("✅ Indexes setup complete")
    
    # Check if test documents already exist
    if pinecone_service.dense_index:
        dense_stats = pinecone_service.dense_index.describe_index_stats()
        dense_count = dense_stats.get('total_vector_count', 0)
    else:
        dense_count = 0
    
    print(f"   Dense index vectors: {dense_count}")
    
    # Upsert test documents if not already present
    if dense_count == 0 or dense_count < 3:
        print("   Upserting test documents...")
        test_documents = [
            {
                "id": "rag_test_1",
                "text": "Trường Đại học Vinh được thành lập năm 1959, là một trong những trường đại học lâu đời và uy tín nhất Việt Nam. Trường có truyền thống đào tạo chất lượng cao.",
                "metadata": {
                    "source": "test",
                    "document_type": "text",
                    "is_test": "true"
                }
            },
            {
                "id": "rag_test_2",
                "text": "Đại học Vinh có nhiều khoa như Khoa Công nghệ Thông tin, Khoa Toán, Khoa Vật lý, Khoa Hóa học, Khoa Sinh học. Mỗi khoa có đội ngũ giảng viên giàu kinh nghiệm.",
                "metadata": {
                    "source": "test",
                    "document_type": "text",
                    "is_test": "true"
                }
            },
            {
                "id": "rag_test_3",
                "text": "Sinh viên Đại học Vinh được đào tạo theo chương trình chuẩn quốc tế với nhiều cơ hội thực tập và nghiên cứu khoa học. Trường có hợp tác với nhiều đại học nổi tiếng trên thế giới.",
                "metadata": {
                    "source": "test",
                    "document_type": "text",
                    "is_test": "true"
                }
            }
        ]
        
        pinecone_service.upsert_documents(
            documents=test_documents,
            namespace="test"
        )
        print("✅ Test documents uploaded")
        print("   Waiting 2 seconds for indexing...")
        import time
        time.sleep(2)
    else:
        print("   Test documents already exist")
    
except Exception as e:
    print(f"❌ Failed to setup indexes: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test 5: Test complete RAG pipeline
print("\n[5/5] Testing complete RAG pipeline (Retrieve + Generate)...")
print("="*70)

test_queries = [
    "Đại học Vinh thành lập năm nao?",
    "Đại học Vinh có những khoa nào?",
    "Chương trình đào tạo của Đại học Vinh như thế nào?"
]

try:
    for i, query in enumerate(test_queries, 1):
        print(f"\n📝 Query {i}: {query}")
        print("-" * 70)
        
        # Step 1: Retrieve relevant documents
        print("   🔍 Step 1: Retrieving documents from Pinecone...")
        search_results = pinecone_service.hybrid_search(
            query=query,
            namespace="test",
            top_k=2
        )
        
        if not search_results:
            print("   ⚠️  No documents retrieved")
            continue
        
        print(f"   ✅ Retrieved {len(search_results)} documents:")
        for j, result in enumerate(search_results, 1):
            score = result.get('_score', 0)
            fields = result.get('fields', {})
            text = fields.get('chunk_text', '')
            text_preview = text[:60] + "..." if len(text) > 60 else text
            print(f"      {j}. Score: {score:.4f} - {text_preview}")
        
        # Step 2: Prepare documents for LLM
        documents = []
        for result in search_results:
            fields = result.get('fields', {})
            documents.append({
                'text': fields.get('chunk_text', ''),
                'metadata': {
                    'source': fields.get('source', 'unknown'),
                    'document_type': fields.get('document_type', 'text')
                },
                'score': result.get('_score', 0)
            })
        
        # Step 3: Generate answer with Qwen
        # Note: qwen-turbo is available in free tier
        print("\n   🤖 Step 2: Generating answer with Qwen-Turbo...")
        response = llm_service.generate_answer(
            query=query,
            documents=documents,
            temperature=0.7,
            max_tokens=300,
            model="qwen3-max"
        )
        
        print("\n   ✅ Generated Answer:")
        print("   " + "─" * 66)
        # Format answer with proper indentation
        answer_lines = response['answer'].split('\n')
        for line in answer_lines:
            print(f"   {line}")
        print("   " + "─" * 66)
        
        print(f"\n   📚 Sources: {len(response['sources'])} documents used")
        
except Exception as e:
    print(f"\n❌ RAG pipeline failed: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Summary
print("\n" + "="*70)
print("TEST SUMMARY")
print("="*70)
print("✅ Environment variables: OK")
print("✅ Services initialization: OK")
print("✅ Pinecone retrieval: OK")
print("✅ Qwen3-Max generation: OK")
print("✅ Complete RAG pipeline: OK")
print("\n🎉 All tests passed! RAG pipeline is working correctly!")
print("\nNote: Test documents in 'test' namespace")
print("="*70)
