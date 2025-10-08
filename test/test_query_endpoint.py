"""
Test query endpoint with proper error handling
"""
import requests
import json

def test_query():
    url = "http://127.0.0.1:8000/api/query/rag"
    
    # Test with Qwen model
    payload = {
        "query": "Thông tin tuyển sinh năm 2025 của trường gồm những gì?",
        "top_k": 10,
        "top_n": 5,
        "temperature": 0.1,
        "max_tokens": 500,
        "model": "qwen-turbo"  # Explicitly use qwen-turbo
    }
    
    try:
        print("Sending query request...")
        print(f"Payload: {json.dumps(payload, ensure_ascii=False, indent=2)}")
        
        response = requests.post(url, json=payload)
        
        print(f"\nStatus Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("\n" + "="*80)
            print("✅ SUCCESS!")
            print("="*80)
            print(f"\nAnswer:\n{result['answer']}")
            print(f"\nNumber of sources: {len(result['sources'])}")
            print("\nSources:")
            for i, source in enumerate(result['sources'][:3], 1):
                metadata = source.get('metadata', {})
                print(f"\n  {i}. Source: {metadata.get('source', 'N/A')}")
                print(f"     Score: {source.get('score', 'N/A')}")
                print(f"     Chunk: {metadata.get('chunk_index', 'N/A')}/{metadata.get('total_chunks', 'N/A')}")
        else:
            print("\n" + "="*80)
            print("❌ ERROR!")
            print("="*80)
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"\n❌ Exception: {str(e)}")

if __name__ == "__main__":
    test_query()
