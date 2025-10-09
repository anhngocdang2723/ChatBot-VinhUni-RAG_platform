"""
Simple script to check Pinecone index status
"""
import os
from dotenv import load_dotenv
from pinecone import Pinecone

# Load environment variables
load_dotenv()

def check_pinecone_status():
    """Check Pinecone indexes status."""
    
    # Get API key
    api_key = os.getenv("PINECONE_API_KEY")
    if not api_key:
        print("❌ PINECONE_API_KEY not found in environment")
        return
    
    # Initialize Pinecone
    pc = Pinecone(api_key=api_key)
    
    print("=" * 80)
    print("PINECONE VECTOR DATABASE STATUS")
    print("=" * 80)
    
    # List all indexes
    print("\n📋 Available Indexes:")
    try:
        indexes = pc.list_indexes()
        if indexes:
            for idx in indexes:
                print(f"  - {idx.name}")
        else:
            print("  ⚠️  No indexes found")
    except Exception as e:
        print(f"  ❌ Error listing indexes: {e}")
        return
    
    # Check dense index
    dense_index_name = "truong-dai-hoc-vinh-dense"
    print(f"\n📊 Dense Index: {dense_index_name}")
    print("-" * 80)
    
    try:
        dense_index = pc.Index(dense_index_name)
        dense_stats = dense_index.describe_index_stats()
        
        total_vectors = dense_stats.get('total_vector_count', 0)
        dimension = dense_stats.get('dimension', 'N/A')
        
        print(f"  Total vectors: {total_vectors:,}")
        print(f"  Dimension: {dimension}")
        
        if total_vectors == 0:
            print("  ⚠️  WARNING: No vectors found in this index!")
        
        # Check namespaces
        namespaces = dense_stats.get('namespaces', {})
        if namespaces:
            print(f"\n  📁 Namespaces ({len(namespaces)}):")
            for ns_name, ns_info in namespaces.items():
                vector_count = ns_info.get('vector_count', 0)
                print(f"    - {ns_name}: {vector_count:,} vectors")
        else:
            print("  ⚠️  No namespaces found")
            
    except Exception as e:
        print(f"  ❌ Error accessing dense index: {e}")
    
    # Check sparse index
    sparse_index_name = "truong-dai-hoc-vinh-sparse"
    print(f"\n📊 Sparse Index: {sparse_index_name}")
    print("-" * 80)
    
    try:
        sparse_index = pc.Index(sparse_index_name)
        sparse_stats = sparse_index.describe_index_stats()
        
        total_vectors = sparse_stats.get('total_vector_count', 0)
        
        print(f"  Total vectors: {total_vectors:,}")
        
        if total_vectors == 0:
            print("  ⚠️  WARNING: No vectors found in this index!")
        
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
    print("SUMMARY")
    print("=" * 80)
    
    try:
        dense_count = pc.Index(dense_index_name).describe_index_stats().get('total_vector_count', 0)
        sparse_count = pc.Index(sparse_index_name).describe_index_stats().get('total_vector_count', 0)
        
        if dense_count == 0 and sparse_count == 0:
            print("❌ NO DATA FOUND in Pinecone!")
            print("\n💡 Possible reasons:")
            print("   1. No documents have been uploaded yet")
            print("   2. Document upload failed")
            print("   3. Wrong namespace being used")
            print("\n🔧 To upload documents, use:")
            print("   python upload_all_documents.py")
        else:
            print(f"✅ Found {dense_count + sparse_count:,} total vectors across both indexes")
    except:
        pass

if __name__ == "__main__":
    check_pinecone_status()
