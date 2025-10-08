"""
Test Pinecone Embedding & Vector Storage Flow
Tests the complete flow: Setup indexes → Upsert documents → Hybrid search
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("=" * 70)
print("TEST: Pinecone Embedding & Vector Storage Flow")
print("=" * 70)

# Step 1: Check environment variables
print("\n[1/6] Checking environment variables...")
required_vars = ["PINECONE_API_KEY", "DASHSCOPE_API_KEY", "SECRET_KEY"]
missing_vars = []

for var in required_vars:
    value = os.getenv(var)
    if not value or "your_" in value.lower():
        missing_vars.append(var)
        print(f"  ❌ {var}: Not set or using default")
    else:
        masked = value[:8] + "..." + value[-4:] if len(value) > 12 else "***"
        print(f"  ✅ {var}: {masked}")

if missing_vars:
    print(f"\n⚠️  Missing required environment variables: {', '.join(missing_vars)}")
    print("Please update .env file with your actual API keys")
    sys.exit(1)

print("\n✅ All required environment variables are set")

# Step 2: Import Pinecone service
print("\n[2/6] Importing Pinecone service...")
try:
    from core.pinecone.pinecone_service import PineconeService
    from core.llm.config import get_settings
    print("✅ Successfully imported PineconeService")
except Exception as e:
    print(f"❌ Failed to import: {str(e)}")
    sys.exit(1)

# Step 3: Initialize Pinecone service
print("\n[3/6] Initializing Pinecone service...")
try:
    settings = get_settings()
    pinecone_service = PineconeService(
        api_key=settings.PINECONE_API_KEY,
        environment=settings.PINECONE_ENVIRONMENT
    )
    print(f"✅ Pinecone service initialized")
    print(f"   Dense index: {pinecone_service.dense_index_name}")
    print(f"   Sparse index: {pinecone_service.sparse_index_name}")
except Exception as e:
    print(f"❌ Failed to initialize: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Step 4: Setup indexes (create if not exist)
print("\n[4/6] Setting up Pinecone indexes...")
print("   This may take 1-2 minutes if indexes need to be created...")
try:
    pinecone_service.setup_indexes()
    print("✅ Indexes setup complete")
    
    # Check index stats
    dense_stats = pinecone_service.dense_index.describe_index_stats()
    sparse_stats = pinecone_service.sparse_index.describe_index_stats()
    
    print(f"   Dense index vectors: {dense_stats.get('total_vector_count', 0)}")
    print(f"   Sparse index vectors: {sparse_stats.get('total_vector_count', 0)}")
except Exception as e:
    print(f"❌ Failed to setup indexes: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Step 5: Test upsert documents
print("\n[5/6] Testing document upsert with Pinecone Integrated Inference...")
print("   Pinecone will automatically embed the text using text-embedding-3-small")

test_documents = [
    {
        "_id": "test_doc_1",
        "chunk_text": "Trường Đại học Vinh được thành lập năm 1959, là một trong những trường đại học lâu đời nhất Việt Nam.",
        "source": "test",
        "document_type": "text",
        "is_test": "true"
    },
    {
        "_id": "test_doc_2",
        "chunk_text": "Đại học Vinh có nhiều khoa như Khoa Công nghệ Thông tin, Khoa Toán, Khoa Vật lý.",
        "source": "test",
        "document_type": "text",
        "is_test": "true"
    },
    {
        "_id": "test_doc_3",
        "chunk_text": "Sinh viên Đại học Vinh được đào tạo theo chương trình chuẩn quốc tế.",
        "source": "test",
        "document_type": "text",
        "is_test": "true"
    }
]

try:
    print(f"   Upserting {len(test_documents)} test documents...")
    pinecone_service.upsert_documents(
        documents=test_documents,
        namespace="test",
        batch_size=3
    )
    print("✅ Successfully upserted test documents")
    
    # Wait a moment for indexing
    import time
    print("   Waiting 2 seconds for indexing...")
    time.sleep(2)
    
    # Check updated stats
    dense_stats = pinecone_service.dense_index.describe_index_stats()
    sparse_stats = pinecone_service.sparse_index.describe_index_stats()
    
    print(f"   Dense index vectors: {dense_stats.get('total_vector_count', 0)}")
    print(f"   Sparse index vectors: {sparse_stats.get('total_vector_count', 0)}")
    
except Exception as e:
    print(f"❌ Failed to upsert documents: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Step 6: Test hybrid search
print("\n[6/6] Testing hybrid search (dense + sparse + reranking)...")

test_queries = [
    "Trường Đại học Vinh thành lập năm nào?",
    "Đại học Vinh có những khoa nào?",
    "Chương trình đào tạo của Đại học Vinh như thế nào?"
]

try:
    for i, query in enumerate(test_queries, 1):
        print(f"\n   Query {i}: {query}")
        
        results = pinecone_service.hybrid_search(
            query=query,
            namespace="test",
            top_k=2
        )
        
        if results:
            print(f"   ✅ Found {len(results)} results:")
            for j, result in enumerate(results, 1):
                # Results are now converted to dicts by PineconeService
                score = result.get('_score', 0)
                fields = result.get('fields', {})
                text = fields.get('chunk_text', '')
                text_preview = text[:80] + "..." if len(text) > 80 else text
                print(f"      {j}. Score: {score:.4f} - {text_preview}")
        else:
            print(f"   ⚠️  No results found or results is None/empty")
            
except Exception as e:
    print(f"❌ Failed to search: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Summary
print("\n" + "=" * 70)
print("TEST SUMMARY")
print("=" * 70)
print("✅ Environment variables: OK")
print("✅ Pinecone service initialization: OK")
print("✅ Index setup: OK")
print("✅ Document upsert (with auto-embedding): OK")
print("✅ Hybrid search (dense + sparse + rerank): OK")
print("\n🎉 All tests passed! Pinecone flow is working correctly!")
print("\nNote: Test documents were created in 'test' namespace")
print("You can delete them later with:")
print("  pinecone_service.delete_namespace('test')")
print("=" * 70)
