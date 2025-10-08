"""
Utility script to delete vectors from Pinecone indexes.
Use this to clean up test data or reset a namespace.
"""
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("="*70)
print("PINECONE VECTOR DELETION UTILITY")
print("="*70)

# Import Pinecone service
try:
    from core.pinecone.pinecone_service import PineconeService
    print("✅ Imported PineconeService")
except ImportError as e:
    print(f"❌ Failed to import: {str(e)}")
    sys.exit(1)

# Initialize Pinecone
try:
    api_key = os.getenv("PINECONE_API_KEY")
    if not api_key:
        print("❌ PINECONE_API_KEY not found in environment")
        sys.exit(1)
    
    pinecone_service = PineconeService(
        api_key=api_key,
        environment="us-east-1"
    )
    pinecone_service.setup_indexes()
    print("✅ Pinecone service initialized\n")
    
except Exception as e:
    print(f"❌ Failed to initialize Pinecone: {str(e)}")
    sys.exit(1)

# Show current index stats
print("="*70)
print("CURRENT INDEX STATISTICS")
print("="*70)

try:
    # Dense index stats
    if pinecone_service.dense_index:
        dense_stats = pinecone_service.dense_index.describe_index_stats()
        print(f"\n📊 Dense Index: {pinecone_service.dense_index_name}")
        print(f"   Total vectors: {dense_stats.get('total_vector_count', 0)}")
        
        namespaces = dense_stats.get('namespaces', {})
        if namespaces:
            print(f"   Namespaces ({len(namespaces)}):")
            for ns, stats in namespaces.items():
                print(f"      - {ns}: {stats.get('vector_count', 0)} vectors")
        else:
            print("   No namespaces found")
    
    # Sparse index stats
    if pinecone_service.sparse_index:
        sparse_stats = pinecone_service.sparse_index.describe_index_stats()
        print(f"\n📊 Sparse Index: {pinecone_service.sparse_index_name}")
        print(f"   Total vectors: {sparse_stats.get('total_vector_count', 0)}")
        
        namespaces = sparse_stats.get('namespaces', {})
        if namespaces:
            print(f"   Namespaces ({len(namespaces)}):")
            for ns, stats in namespaces.items():
                print(f"      - {ns}: {stats.get('vector_count', 0)} vectors")
        else:
            print("   No namespaces found")
    
except Exception as e:
    print(f"❌ Failed to get stats: {str(e)}")
    sys.exit(1)

# Deletion options
print("\n" + "="*70)
print("DELETION OPTIONS")
print("="*70)
print("\n1. Delete specific namespace")
print("2. Delete all vectors (all namespaces)")
print("3. Exit")

choice = input("\nSelect option (1-3): ").strip()

if choice == "1":
    # Delete specific namespace
    namespace = input("\nEnter namespace to delete: ").strip()
    
    if not namespace:
        print("❌ Namespace cannot be empty")
        sys.exit(1)
    
    print(f"\n⚠️  WARNING: This will delete ALL vectors in namespace '{namespace}'")
    print("   from BOTH dense and sparse indexes!")
    confirm = input(f"\nType '{namespace}' to confirm deletion: ").strip()
    
    if confirm != namespace:
        print("❌ Confirmation failed. No vectors deleted.")
        sys.exit(0)
    
    try:
        print(f"\n🗑️  Deleting namespace '{namespace}'...")
        
        # Delete from dense index
        if pinecone_service.dense_index:
            pinecone_service.dense_index.delete(
                namespace=namespace,
                delete_all=True
            )
            print(f"   ✅ Deleted from dense index")
        
        # Delete from sparse index
        if pinecone_service.sparse_index:
            pinecone_service.sparse_index.delete(
                namespace=namespace,
                delete_all=True
            )
            print(f"   ✅ Deleted from sparse index")
        
        print(f"\n✅ Successfully deleted namespace '{namespace}'")
        
        # Show updated stats
        print("\nWaiting 2 seconds for deletion to propagate...")
        import time
        time.sleep(2)
        
        if pinecone_service.dense_index:
            stats = pinecone_service.dense_index.describe_index_stats()
            print(f"\nUpdated stats:")
            print(f"   Total vectors: {stats.get('total_vector_count', 0)}")
        
    except Exception as e:
        print(f"❌ Failed to delete namespace: {str(e)}")
        sys.exit(1)

elif choice == "2":
    # Delete all vectors
    print("\n⚠️  WARNING: This will delete ALL vectors from ALL namespaces!")
    print("   This action CANNOT be undone!")
    confirm = input("\nType 'DELETE ALL' to confirm: ").strip()
    
    if confirm != "DELETE ALL":
        print("❌ Confirmation failed. No vectors deleted.")
        sys.exit(0)
    
    try:
        print("\n🗑️  Deleting all vectors...")
        
        # Get all namespaces first
        if pinecone_service.dense_index:
            dense_stats = pinecone_service.dense_index.describe_index_stats()
            dense_namespaces = list(dense_stats.get('namespaces', {}).keys())
        else:
            dense_namespaces = []
        
        # Delete each namespace
        for namespace in dense_namespaces:
            print(f"   Deleting namespace '{namespace}'...")
            
            if pinecone_service.dense_index:
                pinecone_service.dense_index.delete(
                    namespace=namespace,
                    delete_all=True
                )
            
            if pinecone_service.sparse_index:
                pinecone_service.sparse_index.delete(
                    namespace=namespace,
                    delete_all=True
                )
        
        print(f"\n✅ Successfully deleted {len(dense_namespaces)} namespaces")
        
        # Show updated stats
        print("\nWaiting 2 seconds for deletion to propagate...")
        import time
        time.sleep(2)
        
        if pinecone_service.dense_index:
            stats = pinecone_service.dense_index.describe_index_stats()
            print(f"\nUpdated stats:")
            print(f"   Total vectors: {stats.get('total_vector_count', 0)}")
        
    except Exception as e:
        print(f"❌ Failed to delete vectors: {str(e)}")
        sys.exit(1)

elif choice == "3":
    print("\n👋 Exiting...")
    sys.exit(0)

else:
    print("\n❌ Invalid option")
    sys.exit(1)

print("\n" + "="*70)
