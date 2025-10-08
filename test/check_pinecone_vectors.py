"""
Script to check vectors stored in Pinecone.
Verifies that uploaded documents are actually stored in Pinecone indexes.
"""

import os
from dotenv import load_dotenv
from pinecone import Pinecone
from core.llm.config import CollectionConfig

# Load environment variables
load_dotenv()

def check_pinecone_vectors():
    """Check vectors in Pinecone indexes."""
    
    # Initialize Pinecone
    api_key = os.getenv("PINECONE_API_KEY")
    if not api_key:
        print("❌ PINECONE_API_KEY not found in environment")
        return
    
    pc = Pinecone(api_key=api_key)
    
    print("=" * 80)
    print("PINECONE VECTOR DATABASE CHECK")
    print("=" * 80)
    
    # Check dense index
    dense_index_name = os.getenv("PINECONE_DENSE_INDEX", "rag-dense")
    print(f"\n📊 Dense Index: {dense_index_name}")
    print("-" * 80)
    
    try:
        dense_index = pc.Index(dense_index_name)
        dense_stats = dense_index.describe_index_stats()
        
        print(f"  Total vectors: {dense_stats.get('total_vector_count', 0):,}")
        print(f"  Dimension: {dense_stats.get('dimension', 'N/A')}")
        
        # Check namespaces
        namespaces = dense_stats.get('namespaces', {})
        if namespaces:
            print(f"\n  📁 Namespaces ({len(namespaces)}):")
            for ns_name, ns_info in namespaces.items():
                vector_count = ns_info.get('vector_count', 0)
                print(f"    - {ns_name}: {vector_count:,} vectors")
        else:
            print("  ⚠️  No namespaces found")
        
        # Try to fetch a sample vector from default namespace
        namespace = CollectionConfig.STORAGE_NAME
        print(f"\n  🔍 Checking namespace: {namespace}")
        
        # Query to get some vectors
        try:
            # Create a dummy query vector (same dimension as index)
            dimension = dense_stats.get('dimension', 768)
            dummy_vector = [0.1] * dimension
            
            results = dense_index.query(
                vector=dummy_vector,
                top_k=5,
                namespace=namespace,
                include_metadata=True
            )
            
            if results.matches:
                print(f"    ✅ Found {len(results.matches)} sample vectors")
                print(f"\n    Sample vector IDs:")
                for i, match in enumerate(results.matches[:3], 1):
                    print(f"      {i}. {match.id}")
                    if match.metadata:
                        print(f"         Source: {match.metadata.get('source', 'N/A')}")
                        print(f"         Chunk: {match.metadata.get('chunk_index', 'N/A')}/{match.metadata.get('total_chunks', 'N/A')}")
            else:
                print(f"    ⚠️  No vectors found in namespace '{namespace}'")
                
        except Exception as e:
            print(f"    ❌ Error querying namespace: {e}")
            
    except Exception as e:
        print(f"  ❌ Error accessing dense index: {e}")
    
    # Check sparse index
    sparse_index_name = os.getenv("PINECONE_SPARSE_INDEX", "rag-sparse")
    print(f"\n📊 Sparse Index: {sparse_index_name}")
    print("-" * 80)
    
    try:
        sparse_index = pc.Index(sparse_index_name)
        sparse_stats = sparse_index.describe_index_stats()
        
        print(f"  Total vectors: {sparse_stats.get('total_vector_count', 0):,}")
        
        # Check namespaces
        namespaces = sparse_stats.get('namespaces', {})
        if namespaces:
            print(f"\n  📁 Namespaces ({len(namespaces)}):")
            for ns_name, ns_info in namespaces.items():
                vector_count = ns_info.get('vector_count', 0)
                print(f"    - {ns_name}: {vector_count:,} vectors")
        else:
            print("  ⚠️  No namespaces found")
            
    except Exception as e:
        print(f"  ❌ Error accessing sparse index: {e}")
    
    print("\n" + "=" * 80)
    print("✅ Check complete!")
    print("=" * 80)

if __name__ == "__main__":
    check_pinecone_vectors()
