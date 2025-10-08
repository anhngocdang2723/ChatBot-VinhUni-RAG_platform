"""
Debug hybrid search directly
"""
import sys
sys.path.append('.')

from core.pinecone.pinecone_service import PineconeService
from core.llm.config import get_settings

settings = get_settings()

print("Initializing Pinecone...")
ps = PineconeService(
    api_key=settings.PINECONE_API_KEY,
    environment=settings.PINECONE_ENVIRONMENT
)

print("Setting up indexes...")
ps.setup_indexes()

query = "tuyển sinh 2025"
namespace = "truong-dai-hoc-vinh"

print(f"\nTesting hybrid search with query: '{query}'")
print(f"Namespace: {namespace}")

try:
    results = ps.hybrid_search(
        query=query,
        namespace=namespace,
        top_k=10
    )
    
    print(f"\n✅ Hybrid search returned {len(results)} results")
    
    if results:
        print("\nFirst result:")
        print(f"  ID: {results[0].get('_id', 'N/A')}")
        print(f"  Score: {results[0].get('_score', 'N/A')}")
        fields = results[0].get('fields', {})
        print(f"  Source: {fields.get('source', 'N/A')}")
        print(f"  Text preview: {fields.get('chunk_text', '')[:100]}...")
        
        # Test rerank
        print(f"\n\nTesting rerank with {len(results)} results...")
        reranked = ps.rerank_results(
            query=query,
            results=results,
            top_n=5
        )
        
        print(f"✅ Rerank returned {len(reranked)} results")
        print(f"Type: {type(reranked)}")
        
        if reranked:
            print("\nFirst reranked result:")
            print(f"  Type: {type(reranked[0])}")
            print(f"  Content: {reranked[0]}")
    else:
        print("\n❌ No results found!")
        
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
