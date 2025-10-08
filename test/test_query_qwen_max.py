"""
Test query with qwen-max (default model)
"""
import requests
import json

def test_query_with_max():
    url = "http://127.0.0.1:8000/api/query/rag"
    
    # Test without specifying model - should use qwen-max by default
    payload = {
        "query": "Các ngành đào tạo của trường Đại học Vinh năm 2025 là gì?",
        "top_k": 10,
        "top_n": 5,
        "temperature": 0.3,
        "max_tokens": 800
        # No model specified - should default to qwen-max
    }
    
    try:
        print("Testing with DEFAULT model (should be qwen-max)...")
        print(f"Query: {payload['query']}")
        
        response = requests.post(url, json=payload)
        
        print(f"\nStatus Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("\n" + "="*80)
            print("✅ SUCCESS with DEFAULT MODEL!")
            print("="*80)
            print(f"\nAnswer:\n{result['answer']}")
            print(f"\nNumber of sources: {len(result['sources'])}")
            print("\nTop 3 Sources:")
            for i, source in enumerate(result['sources'][:3], 1):
                metadata = source.get('metadata', {})
                print(f"\n  {i}. File: {metadata.get('original_filename', 'N/A')}")
                print(f"     Score: {source.get('score', 'N/A')}")
                print(f"     Chunk: {metadata.get('chunk_id', 'N/A')}/{metadata.get('total_chunks', 'N/A')}")
        else:
            print("\n" + "="*80)
            print("❌ ERROR!")
            print("="*80)
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"\n❌ Exception: {str(e)}")

if __name__ == "__main__":
    test_query_with_max()
