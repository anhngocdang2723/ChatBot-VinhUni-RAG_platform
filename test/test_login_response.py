"""Test login responses for all demo accounts to verify portal field."""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_login(username, password):
    """Test login and show response."""
    print(f"\n{'='*60}")
    print(f"Testing: {username}")
    print(f"{'='*60}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": username, "password": password}
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response:")
        print(json.dumps(response.json(), indent=2, ensure_ascii=False))
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                user = data.get('user', {})
                print(f"\n✅ Login successful!")
                print(f"   Role: {user.get('role')}")
                print(f"   Portal: {user.get('portal')} ← This determines routing!")
                print(f"   Expected route:")
                
                role = user.get('role')
                portal = user.get('portal')
                
                if role == 'admin' and portal == 'portal':
                    print(f"   → /admin/dashboard")
                elif role == 'lecturer' and portal == 'elearning':
                    print(f"   → /lecturer/dashboard")
                elif role == 'student' and portal == 'elearning':
                    print(f"   → /elearning or /student/dashboard")
                elif role == 'student' and portal == 'portal':
                    print(f"   → /student/dashboard")
                else:
                    print(f"   ⚠️ Unknown routing for role={role}, portal={portal}")
        
    except Exception as e:
        print(f"❌ Error: {e}")

# Test cases
print("\n" + "="*60)
print("TESTING LOGIN RESPONSES FOR ALL ROLES")
print("="*60)

# Test admin
test_login("admin", "admin")

# Test lecturer
test_login("lecturer", "lecturer")

# Test student (elearning portal)
test_login("student", "student")

# Test special student (portal)
test_login("215748020110333", "215748020110333")

print("\n" + "="*60)
print("SUMMARY")
print("="*60)
print("Check if:")
print("1. All logins return 'portal' field")
print("2. Student accounts have correct portal value")
print("3. Frontend receives portal field to determine routing")
