"""
Quick test to verify backend is ready for frontend connection
"""
import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_endpoint(name, method, endpoint, data=None):
    """Test a single endpoint"""
    url = f"{BASE_URL}{endpoint}"
    print(f"\n[TEST] {name}")
    print(f"  {method} {endpoint}")
    
    try:
        if method == "GET":
            response = requests.get(url, timeout=30)
        elif method == "POST":
            response = requests.post(url, json=data, timeout=30)
        
        status = "✅" if response.status_code < 400 else "❌"
        print(f"  {status} Status: {response.status_code}")
        
        if response.status_code < 400:
            print(f"  Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)[:200]}...")
        else:
            print(f"  Error: {response.text[:100]}")
        
        return response.status_code < 400
        
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False

def main():
    print("="*70)
    print("BACKEND READINESS TEST FOR FRONTEND".center(70))
    print("="*70)
    
    results = []
    
    # Test 1: Health Check
    results.append(test_endpoint(
        "Health Check",
        "GET",
        "/health"
    ))
    
    # Test 2: Query RAG
    results.append(test_endpoint(
        "RAG Query",
        "POST",
        "/query/rag",
        {
            "query": "test query",
            "top_k": 5,
            "top_n": 3
        }
    ))
    
    # Test 3: Retrieve
    results.append(test_endpoint(
        "Retrieve Documents",
        "POST",
        "/query/retrieve",
        {
            "query": "test query"
        }
    ))
    
    # Test 4: Collections (Expected to fail if not implemented)
    results.append(test_endpoint(
        "List Collections",
        "GET",
        "/manage/collections"
    ))
    
    # Summary
    print("\n" + "="*70)
    print("SUMMARY".center(70))
    print("="*70)
    passed = sum(results)
    total = len(results)
    print(f"\nPassed: {passed}/{total}")
    
    if passed >= 3:  # Health, RAG, Retrieve are essential
        print("\n✅ Backend is READY for frontend!")
        print("   Essential endpoints are working.")
        if passed < total:
            print("\n⚠️  Some optional endpoints are missing (e.g., collections)")
            print("   Frontend will work but may show errors for those features.")
    else:
        print("\n❌ Backend NOT ready!")
        print("   Critical endpoints are failing.")
    
    print("\nNext step:")
    print("  cd frontend")
    print("  npm install")
    print("  npm start")
    print("\nThen open: http://localhost:3000")

if __name__ == "__main__":
    main()
