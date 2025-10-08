"""
Debug: Check if session cookie is being sent with query request
"""
import requests
import json

BASE_URL = "http://localhost:8000"

print("\n" + "="*70)
print("DEBUG: Session Cookie in Query Request")
print("="*70)

# Step 1: Login first
print("\nStep 1: Login...")
login_response = requests.post(
    f"{BASE_URL}/api/auth/login",
    json={
        "username": "student",
        "password": "student",
        "portal": "elearning"
    }
)

if login_response.status_code != 200:
    print("❌ Login failed!")
    print(login_response.json())
    exit(1)

print("✅ Login successful")
cookies = login_response.cookies
print(f"Session cookie: {cookies.get('session_id')}")

# Step 2: Verify session with /me
print("\nStep 2: Test /api/auth/me...")
me_response = requests.get(
    f"{BASE_URL}/api/auth/me",
    cookies=cookies
)
print(f"Status: {me_response.status_code}")
if me_response.status_code == 200:
    print(f"✅ User: {me_response.json()['user']['username']}")
else:
    print(f"❌ Failed: {me_response.text}")

# Step 3: Test query WITHOUT cookies (should fail with 401)
print("\nStep 3: Test query WITHOUT cookies...")
query_response_no_cookie = requests.post(
    f"{BASE_URL}/api/query/rag",
    json={
        "query": "Test query",
        "top_k": 10,
        "top_n": 5,
        "temperature": 0.2,
        "max_tokens": 500
    }
)
print(f"Status: {query_response_no_cookie.status_code}")
if query_response_no_cookie.status_code == 401:
    print("✅ Correctly returns 401 without cookie")
else:
    print(f"❌ Unexpected status: {query_response_no_cookie.status_code}")

# Step 4: Test query WITH cookies (should work)
print("\nStep 4: Test query WITH cookies...")
query_response = requests.post(
    f"{BASE_URL}/api/query/rag",
    json={
        "query": "Trường Đại học Vinh ở đâu?",
        "top_k": 10,
        "top_n": 5,
        "temperature": 0.2,
        "max_tokens": 500,
        "model": "qwen3-max"
    },
    cookies=cookies  # ← Should send session cookie
)

print(f"Status: {query_response.status_code}")

if query_response.status_code == 200:
    print("✅ Query successful with cookie!")
    result = query_response.json()
    print(f"Answer preview: {result['answer'][:100]}...")
elif query_response.status_code == 401:
    print("❌ Still 401 even with cookie!")
    print(f"Response: {query_response.text}")
    print("\n🔍 DIAGNOSIS:")
    print("The cookie is not being recognized by backend.")
    print("\nPossible causes:")
    print("1. Cookie name mismatch")
    print("2. Cookie not being sent in request")
    print("3. CORS issue preventing cookie")
    print("4. Backend dependency not reading cookie correctly")
    
    # Check what cookies are being sent
    print("\n📋 Cookies being sent:")
    print(f"   {cookies}")
else:
    print(f"❌ Unexpected error: {query_response.status_code}")
    print(query_response.text)

print("\n" + "="*70)
print("SUMMARY")
print("="*70)
print(f"Login: {'✅' if login_response.status_code == 200 else '❌'}")
print(f"/auth/me: {'✅' if me_response.status_code == 200 else '❌'}")
print(f"/query/rag (no cookie): {'✅' if query_response_no_cookie.status_code == 401 else '❌'}")
print(f"/query/rag (with cookie): {'✅' if query_response.status_code == 200 else '❌'}")

if query_response.status_code != 200:
    print("\n⚠️  FRONTEND ISSUE DETECTED!")
    print("The backend is working (login and /auth/me work).")
    print("But /query/rag returns 401 even with valid cookie.")
    print("\nThis means FRONTEND is not sending cookies correctly.")
    print("Check: withCredentials in ApiContext.js")
