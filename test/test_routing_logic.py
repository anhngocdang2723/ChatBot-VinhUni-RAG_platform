"""
Test routing logic for all demo accounts.
Shows expected routes based on role + portal combination.
"""
import json

# Load demo accounts
with open('data/demo_accounts.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print("\n" + "="*70)
print("ROUTING TEST FOR ALL DEMO ACCOUNTS")
print("="*70)

def get_expected_route(role, portal):
    """Determine expected route based on role and portal."""
    if portal == 'portal':
        if role == 'admin':
            return '/admin'
        elif role == 'student':
            return '/user'
        else:
            return '/user'
    elif portal == 'elearning':
        if role == 'student':
            return '/elearning/student'
        elif role == 'lecturer':
            return '/elearning/lecturer'
        else:
            return 'ERROR: No route for this role in elearning'
    else:
        return f'ERROR: Unknown portal "{portal}"'

# Group by role
by_role = {'admin': [], 'lecturer': [], 'student': []}
for user in data['users']:
    by_role[user['role']].append(user)

# Test each role
for role, users in by_role.items():
    print(f"\n{'='*70}")
    print(f"ROLE: {role.upper()}")
    print(f"{'='*70}")
    
    for user in users:
        portal = user['portal']
        expected_route = get_expected_route(role, portal)
        
        print(f"\n  Username: {user['username']}")
        print(f"  Password: {user['password']}")
        print(f"  Full Name: {user['full_name']}")
        print(f"  Portal: {portal}")
        print(f"  Expected Route: {expected_route}")
        
        # Highlight special cases
        if role == 'student' and portal == 'portal':
            print(f"  ⚠️  SPECIAL: Student in Portal → Routes to /user")
        elif role == 'student' and portal == 'elearning':
            print(f"  ✅ NORMAL: Student in E-learning → Routes to /elearning/student")

print("\n" + "="*70)
print("SUMMARY")
print("="*70)
print("""
ADMIN (portal="portal"):
  → /admin

LECTURER (portal="elearning"):
  → /elearning/lecturer

STUDENT (portal="elearning"):
  → /elearning/student
  
STUDENT (portal="portal"): ⚠️ SPECIAL CASE
  → /user
  
Test accounts for this special case:
  - student4/student
  - 215748020110333/215748020110333
""")

print("\n" + "="*70)
print("TESTING INSTRUCTIONS")
print("="*70)
print("""
1. Start backend: python -m uvicorn main:app --reload --port 8000
2. Start frontend: cd frontend && npm start
3. Open http://localhost:3000 in browser
4. Open DevTools (F12) → Console tab
5. Test each account above
6. Verify console shows: "Redirecting to [expected route]"
7. Verify browser URL changes to expected route
""")
