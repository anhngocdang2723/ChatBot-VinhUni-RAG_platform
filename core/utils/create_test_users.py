import bcrypt

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

test_users = [
    # Admin account
    {
        'username': 'admin',
        'email': 'admin@example.com',
        'password': 'Admin@123',
        'full_name': 'System Administrator',
        'role': 'admin'
    },
    # Lecturer account
    {
        'username': 'lecturer',
        'email': 'lecturer@example.com',
        'password': 'Lecturer@123',
        'full_name': 'Lecturer Account',
        'role': 'lecturer'
    },
    # 10 normal users
    {
        'username': 'user1',
        'email': 'user1@example.com',
        'password': 'User@123',
        'full_name': 'Normal User 1',
        'role': 'user'
    },
    {
        'username': 'user2',
        'email': 'user2@example.com',
        'password': 'User@123',
        'full_name': 'Normal User 2',
        'role': 'user'
    },
    {
        'username': 'user3',
        'email': 'user3@example.com',
        'password': 'User@123',
        'full_name': 'Normal User 3',
        'role': 'user'
    },
    {
        'username': 'user4',
        'email': 'user4@example.com',
        'password': 'User@123',
        'full_name': 'Normal User 4',
        'role': 'user'
    },
    {
        'username': 'user5',
        'email': 'user5@example.com',
        'password': 'User@123',
        'full_name': 'Normal User 5',
        'role': 'user'
    },
    {
        'username': 'user6',
        'email': 'user6@example.com',
        'password': 'User@123',
        'full_name': 'Normal User 6',
        'role': 'user'
    },
    {
        'username': 'user7',
        'email': 'user7@example.com',
        'password': 'User@123',
        'full_name': 'Normal User 7',
        'role': 'user'
    },
    {
        'username': 'user8',
        'email': 'user8@example.com',
        'password': 'User@123',
        'full_name': 'Normal User 8',
        'role': 'user'
    },
    {
        'username': 'user9',
        'email': 'user9@example.com',
        'password': 'User@123',
        'full_name': 'Normal User 9',
        'role': 'user'
    },
    {
        'username': 'user10',
        'email': 'user10@example.com',
        'password': 'User@123',
        'full_name': 'Normal User 10',
        'role': 'user'
    },
    # 10 students
    {
        'username': 'student1',
        'email': 'student1@example.com',
        'password': 'Student@123',
        'full_name': 'Student Account 1',
        'role': 'student'
    },
    {
        'username': 'student2',
        'email': 'student2@example.com',
        'password': 'Student@123',
        'full_name': 'Student Account 2',
        'role': 'student'
    },
    {
        'username': 'student3',
        'email': 'student3@example.com',
        'password': 'Student@123',
        'full_name': 'Student Account 3',
        'role': 'student'
    },
    {
        'username': 'student4',
        'email': 'student4@example.com',
        'password': 'Student@123',
        'full_name': 'Student Account 4',
        'role': 'student'
    },
    {
        'username': 'student5',
        'email': 'student5@example.com',
        'password': 'Student@123',
        'full_name': 'Student Account 5',
        'role': 'student'
    },
    {
        'username': 'student6',
        'email': 'student6@example.com',
        'password': 'Student@123',
        'full_name': 'Student Account 6',
        'role': 'student'
    },
    {
        'username': 'student7',
        'email': 'student7@example.com',
        'password': 'Student@123',
        'full_name': 'Student Account 7',
        'role': 'student'
    },
    {
        'username': 'student8',
        'email': 'student8@example.com',
        'password': 'Student@123',
        'full_name': 'Student Account 8',
        'role': 'student'
    },
    {
        'username': 'student9',
        'email': 'student9@example.com',
        'password': 'Student@123',
        'full_name': 'Student Account 9',
        'role': 'student'
    },
    {
        'username': 'student10',
        'email': 'student10@example.com',
        'password': 'Student@123',
        'full_name': 'Student Account 10',
        'role': 'student'
    }
]

print("-- Xóa users cũ nếu có")
usernames = [f"'{user['username']}'" for user in test_users]
print(f"DELETE FROM users WHERE username IN ({', '.join(usernames)});\n")

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