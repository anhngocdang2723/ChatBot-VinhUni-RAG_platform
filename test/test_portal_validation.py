"""
Test new portal validation logic.

NEW LOGIC:
- User selects portal (via button in frontend)
- Backend validates if user has access to that portal
- Returns portal that user selected (if valid)

RULES:
- Admin: can ONLY access "portal"
- Lecturer: can ONLY access "elearning"
- Student: can access BOTH "portal" and "elearning"
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_login_with_portal(username, password, portal):
    """Test login with specific portal selection."""
    print(f"\n{'='*70}")
    print(f"Test: {username} → {portal}")
    print(f"{'='*70}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "username": username,
                "password": password,
                "portal": portal
            }
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            user = data.get('user', {})
            print(f"✅ SUCCESS")
            print(f"   Role: {user.get('role')}")
            print(f"   Portal returned: {user.get('portal')}")
            print(f"   Expected route: ", end="")
            
            role = user.get('role')
            portal_returned = user.get('portal')
            
            if role == 'admin' and portal_returned == 'portal':
                print(f"/admin")
            elif role == 'lecturer' and portal_returned == 'elearning':
                print(f"/elearning/lecturer")
            elif role == 'student' and portal_returned == 'elearning':
                print(f"/elearning/student")
            elif role == 'student' and portal_returned == 'portal':
                print(f"/user")
            else:
                print(f"UNKNOWN")
        else:
            data = response.json()
            print(f"❌ FAILED")
            print(f"   Message: {data.get('detail', data.get('message'))}")
            
    except Exception as e:
        print(f"❌ ERROR: {e}")

print("\n" + "="*70)
print("TESTING PORTAL VALIDATION LOGIC")
print("="*70)

# Test 1: Admin tries both portals
print("\n" + "="*70)
print("TEST GROUP 1: ADMIN")
print("="*70)
test_login_with_portal("admin", "admin", "portal")  # Should succeed
test_login_with_portal("admin", "admin", "elearning")  # Should fail

# Test 2: Lecturer tries both portals
print("\n" + "="*70)
print("TEST GROUP 2: LECTURER")
print("="*70)
test_login_with_portal("lecturer", "lecturer", "elearning")  # Should succeed
test_login_with_portal("lecturer", "lecturer", "portal")  # Should fail

# Test 3: Student tries both portals (SHOULD BOTH WORK)
print("\n" + "="*70)
print("TEST GROUP 3: STUDENT (Should work with BOTH portals)")
print("="*70)
test_login_with_portal("student", "student", "elearning")  # Should succeed
test_login_with_portal("student", "student", "portal")  # Should succeed

# Test 4: Special student account
print("\n" + "="*70)
print("TEST GROUP 4: SPECIAL STUDENT (215748020110333)")
print("="*70)
test_login_with_portal("215748020110333", "215748020110333", "portal")  # Should succeed
test_login_with_portal("215748020110333", "215748020110333", "elearning")  # Should succeed

print("\n" + "="*70)
print("SUMMARY")
print("="*70)
print("""
✅ EXPECTED RESULTS:
1. Admin + portal="portal" → SUCCESS
2. Admin + portal="elearning" → FAIL (403 Forbidden)
3. Lecturer + portal="elearning" → SUCCESS
4. Lecturer + portal="portal" → FAIL (403 Forbidden)
5. Student + portal="elearning" → SUCCESS → /elearning/student
6. Student + portal="portal" → SUCCESS → /user

KEY POINT: Students can choose EITHER portal, backend validates and returns
the portal they selected.
""")
