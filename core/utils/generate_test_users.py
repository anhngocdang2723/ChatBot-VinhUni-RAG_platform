from core.auth.password_utils import hash_password 

test_users = [
    {
        'username': 'admin',
        'email': 'admin@example.com',
        'password': 'Admin@123',
        'full_name': 'System Administrator',
        'role': 'admin'
    },
    {
        'username': 'user',
        'email': 'user@example.com',
        'password': 'User@123',
        'full_name': 'Normal User',
        'role': 'user'
    },
    {
        'username': 'student',
        'email': 'student@example.com',
        'password': 'Student@123',
        'full_name': 'Student Account',
        'role': 'student'
    },
    {
        'username': 'lecturer',
        'email': 'lecturer@example.com',
        'password': 'Lecturer@123',
        'full_name': 'Lecturer Account',
        'role': 'lecturer'
    }
]

print("-- Xóa users cũ nếu có")
print("DELETE FROM users WHERE username IN ('admin', 'user', 'student', 'lecturer');\n")

print("-- Tạo users mới với password đã hash")
for user in test_users:
    hashed_pwd = hash_password(user['password'])
    print(f"""
INSERT INTO users (
    username,
    email,
    password_hash,
    full_name,
    role,
    verified,
    is_active
) VALUES (
    '{user['username']}',
    '{user['email']}',
    '{hashed_pwd}',
    '{user['full_name']}',
    '{user['role']}',
    TRUE,
    TRUE
);""") 