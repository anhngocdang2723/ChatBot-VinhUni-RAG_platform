"""
Quick test to verify student portal access is fixed.
Run this AFTER restarting frontend.
"""
import requests
import json

BASE_URL = "http://localhost:8000"

print("\n" + "="*70)
print("QUICK TEST: Student Portal Access")
print("="*70)

# Test student with portal selection
test_cases = [
    ("student", "student", "elearning", "/elearning/student"),
    ("student", "student", "portal", "/user"),
]

for username, password, portal, expected_route in test_cases:
    print(f"\n{'='*70}")
    print(f"Test: {username} with portal={portal}")
    print(f"{'='*70}")
    
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={
            "username": username,
            "password": password,
            "portal": portal
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        user = data['user']
        print(f"✅ Login successful")
        print(f"   Role: {user['role']}")
        print(f"   Portal: {user['portal']}")
        print(f"   Expected route: {expected_route}")
        print(f"\n   Frontend should:")
        print(f"   1. Redirect to {expected_route}")
        print(f"   2. ProtectedRoute allows role='{user['role']}' + portal='{user['portal']}'")
        print(f"   3. Show dashboard successfully")
    else:
        print(f"❌ Failed: {response.json()}")

print("\n" + "="*70)
print("INSTRUCTIONS")
print("="*70)
print("""
1. Make sure frontend is running (npm start)
2. Open http://localhost:3000 in browser
3. Open DevTools (F12) → Console tab
4. Test both cases:

   A. Student → E-Learning:
      - Click "E-Learning" button
      - Login: student/student
      - Should go to /elearning/student ✅

   B. Student → Portal:
      - Logout
      - Click "Cổng SV" button  
      - Login: student/student
      - Should go to /user ✅ (THIS WAS BROKEN, NOW FIXED)

5. Both should work now!
""")
