import json

# Base accounts
accounts = {
    "users": [
        {
            "id": 1,
            "username": "admin",
            "password": "admin",
            "full_name": "Quản Trị Viên Hệ Thống",
            "email": "admin@vinhuni.edu.vn",
            "role": "admin",
            "portal": "portal",
            "department": "Phòng Quản Trị Hệ Thống",
            "avatar": None
        },
        {
            "id": 2,
            "username": "admin2",
            "password": "admin",
            "full_name": "Nguyễn Văn Hùng",
            "email": "nvhung@vinhuni.edu.vn",
            "role": "admin",
            "portal": "portal",
            "department": "Phòng Công Nghệ Thông Tin",
            "avatar": None
        },
        {
            "id": 3,
            "username": "lecturer",
            "password": "lecturer",
            "full_name": "TS. Trần Thị Mai",
            "email": "ttmai@vinhuni.edu.vn",
            "role": "lecturer",
            "portal": "elearning",
            "department": "Khoa Công Nghệ Thông Tin",
            "courses": ["Machine Learning", "Deep Learning"],
            "avatar": None
        },
        {
            "id": 4,
            "username": "lecturer2",
            "password": "lecturer",
            "full_name": "PGS.TS. Lê Văn Nam",
            "email": "lvnam@vinhuni.edu.vn",
            "role": "lecturer",
            "portal": "elearning",
            "department": "Khoa Toán - Tin",
            "courses": ["Cấu Trúc Dữ Liệu", "Thuật Toán"],
            "avatar": None
        },
        {
            "id": 5,
            "username": "lecturer3",
            "password": "lecturer",
            "full_name": "ThS. Phạm Thị Lan",
            "email": "ptlan@vinhuni.edu.vn",
            "role": "lecturer",
            "portal": "elearning",
            "department": "Khoa Khoa Học Máy Tính",
            "courses": ["Lập Trình Web", "Cơ Sở Dữ Liệu"],
            "avatar": None
        },
        {
            "id": 6,
            "username": "student",
            "password": "student",
            "full_name": "Nguyễn Văn An",
            "email": "nvan@student.vinhuni.edu.vn",
            "role": "student",
            "portal": "elearning",
            "student_id": "215748020110333",
            "class": "K65 - CNTT",
            "year": 3,
            "avatar": None
        },
        {
            "id": 7,
            "username": "student2",
            "password": "student",
            "full_name": "Trần Thị Bình",
            "email": "ttbinh@student.vinhuni.edu.vn",
            "role": "student",
            "portal": "elearning",
            "student_id": "215748020110334",
            "class": "K65 - KHMT",
            "year": 3,
            "avatar": None
        },
        {
            "id": 8,
            "username": "student3",
            "password": "student",
            "full_name": "Lê Minh Cường",
            "email": "lmcuong@student.vinhuni.edu.vn",
            "role": "student",
            "portal": "elearning",
            "student_id": "215748020220101",
            "class": "K66 - CNTT",
            "year": 2,
            "avatar": None
        },
        {
            "id": 9,
            "username": "student4",
            "password": "student",
            "full_name": "Đặng Ngọc Anh",
            "email": "dnganh@student.vinhuni.edu.vn",
            "role": "student",
            "portal": "portal",
            "student_id": "215748020110333",
            "class": "K65 - CNTT",
            "year": 3,
            "avatar": None
        },
        {
            "id": 10,
            "username": "215748020110333",
            "password": "215748020110333",
            "full_name": "Đặng Ngọc Anh",
            "email": "dnganh@student.vinhuni.edu.vn",
            "role": "student",
            "portal": "portal",
            "student_id": "215748020110333",
            "class": "K65 - CNTT",
            "year": 3,
            "avatar": None
        }
    ]
}

# Generate test1-test30
for i in range(1, 31):
    accounts["users"].append({
        "id": 10 + i,
        "username": f"test{i}",
        "password": str(i),
        "full_name": f"Test User {i}",
        "email": f"test{i}@student.vinhuni.edu.vn",
        "role": "student",
        "portal": "portal",
        "student_id": f"21574802012{i:04d}",
        "class": "K65 - CNTT",
        "year": 3,
        "avatar": None
    })

# Save to file
with open("data/demo_accounts.json", "w", encoding="utf-8") as f:
    json.dump(accounts, f, ensure_ascii=False, indent=2)

print(f"✅ Created demo_accounts.json with {len(accounts['users'])} accounts")
print(f"   - 2 admins")
print(f"   - 3 lecturers")  
print(f"   - 5 base students")
print(f"   - 30 test accounts (test1-test30)")
