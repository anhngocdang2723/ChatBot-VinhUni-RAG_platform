"""
Test full authentication and query flow after fixes.
"""
import requests
import json

BASE_URL = "http://localhost:8000"

print("\n" + "="*70)
print("TESTING: Full Authentication + Query Flow")
print("="*70)

# Step 1: Login
print("\n" + "="*70)
print("STEP 1: Login")
print("="*70)

login_response = requests.post(
    f"{BASE_URL}/api/auth/login",
    json={
        "username": "student",
        "password": "student",
        "portal": "elearning"
    }
)

print(f"Status: {login_response.status_code}")

if login_response.status_code != 200:
    print(f"❌ Login failed!")
    print(json.dumps(login_response.json(), indent=2))
    exit(1)

data = login_response.json()
print(f"✅ Login successful!")
print(f"User: {data['user']['username']}")
print(f"Role: {data['user']['role']}")
print(f"Portal: {data['user']['portal']}")

# Get session cookie
cookies = login_response.cookies
print(f"\n📋 Session cookie received: {cookies.get('session_id')[:20]}...")

# Step 2: Test /api/auth/me
print("\n" + "="*70)
print("STEP 2: Verify session with /api/auth/me")
print("="*70)

me_response = requests.get(
    f"{BASE_URL}/api/auth/me",
    cookies=cookies
)

print(f"Status: {me_response.status_code}")

if me_response.status_code == 200:
    me_data = me_response.json()
    print(f"✅ Session valid!")
    print(f"User: {me_data['user']['username']}")
else:
    print(f"❌ Session invalid!")
    print(json.dumps(me_response.json(), indent=2))
    exit(1)

# Step 3: Send query
print("\n" + "="*70)
print("STEP 3: Send RAG query")
print("="*70)

query_text = "Trường Đại học Vinh ở đâu?"
print(f"Query: {query_text}")

query_response = requests.post(
    f"{BASE_URL}/api/query/rag",
    json={
        "query": query_text,
        "top_k": 12,
        "top_n": 4,
        "temperature": 0.2,
        "max_tokens": 600,
        "model": "qwen3-max"
    },
    cookies=cookies
)

print(f"\nStatus: {query_response.status_code}")

if query_response.status_code == 200:
    result = query_response.json()
    print(f"✅ Query successful!")
    print(f"\n{'='*70}")
    print("ANSWER:")
    print(f"{'='*70}")
    print(result['answer'])
    print(f"\n{'='*70}")
    print(f"SOURCES: {len(result['sources'])} documents")
    print(f"{'='*70}")
    for i, source in enumerate(result['sources'][:3], 1):
        print(f"\n{i}. {source.get('title', 'No title')}")
        print(f"   Score: {source.get('score', 'N/A')}")
        if 'content' in source:
            print(f"   Preview: {source['content'][:100]}...")
else:
    print(f"❌ Query failed!")
    print(f"Error: {query_response.text}")
    
    if query_response.status_code == 401:
        print("\n⚠️  Authentication error!")
        print("Possible causes:")
        print("- Frontend not sending cookies (check withCredentials)")
        print("- Session expired")
        print("- Backend not using correct auth dependency")

print("\n" + "="*70)
print("TEST COMPLETE")
print("="*70)

if query_response.status_code == 200:
    print("✅ ALL TESTS PASSED!")
    print("\nSystem is working correctly:")
    print("1. Login creates session ✅")
    print("2. Session cookie sent with requests ✅")
    print("3. Backend authenticates via cookie ✅")
    print("4. Query processed successfully ✅")
else:
    print("❌ TESTS FAILED")
    print("\nCheck:")
    print("1. Backend is running on port 8000")
    print("2. CORS is configured for localhost:3000")
    print("3. withCredentials enabled in frontend")
    print("4. All routers use get_current_user_from_session")
