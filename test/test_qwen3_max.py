"""
Test query with qwen3-max model (default)
"""
import requests
import json

def test_with_qwen3_max():
    url = "http://127.0.0.1:8000/api/query/rag"
    
    # Test without specifying model - should use qwen3-max by default
    payload = {
        "query": "Trường Đại học Vinh có những khoa nào?",
        "top_k": 10,
        "top_n": 5,
        "temperature": 0.2,
        "max_tokens": 600
    }
    
    try:
        print("="*80)
        print("TEST: Query with DEFAULT MODEL (qwen3-max)")
        print("="*80)
        print(f"\nQuery: {payload['query']}")
        print(f"Temperature: {payload['temperature']}")
        print(f"Max tokens: {payload['max_tokens']}")
        print("\nSending request...")
        
        response = requests.post(url, json=payload, timeout=30)
        
        print(f"\n✅ Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("\n" + "="*80)
            print("🎉 SUCCESS with qwen3-max!")
            print("="*80)
            print(f"\n📝 Answer:\n")
            print(result['answer'])
            print(f"\n📚 Number of sources: {len(result['sources'])}")
            
            if result['sources']:
                print("\n🔍 Top 3 Sources:")
                for i, source in enumerate(result['sources'][:3], 1):
                    metadata = source.get('metadata', {})
                    print(f"\n  [{i}] {metadata.get('original_filename', 'unknown')}")
                    print(f"      Score: {source.get('score', 0):.4f}")
                    print(f"      Chunk: {metadata.get('chunk_id', 'N/A')}/{metadata.get('total_chunks', 'N/A')}")
                    
            print("\n" + "="*80)
        else:
            print("\n❌ ERROR!")
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.Timeout:
        print("\n⏱️  Request timed out (qwen3-max might take longer to respond)")
    except Exception as e:
        print(f"\n❌ Exception: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_with_qwen3_max()
