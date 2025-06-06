-- Xóa users cũ nếu có
DELETE FROM users WHERE username IN ('admin', 'lecturer', 'user1', 'user2', 'user3', 'user4', 'user5', 'user6', 'user7', 'user8', 'user9', 'user10', 'student1', 'student2', 'student3', 'student4', 'student5', 'student6', 'student7', 'student8', 'student9', 'student10');

-- Tạo users mới với password đã hash

INSERT INTO users (
    username,
    email,
    password_hash,
    full_name,
    role,
    verified,
    is_active
) VALUES (
    'admin',
    'admin@example.com',
    '$2b$12$7SdbfCmaJFmJyPGB9QuaQ.1NLs46rhFqOnOo/D7SWzzHsJDzroioW',
    'System Administrator',
    'admin',
    TRUE,
    TRUE
);

INSERT INTO users (
    username,
    email,
    password_hash,
    full_name,
    role,
    verified,
    is_active
) VALUES (
    'lecturer',
    'lecturer@example.com',
    '$2b$12$GFzJXkkUjNfvctzY5E2tLOn4IPaesTiYnBvzPN.pjNRPJs4O8/9h6',
    'Lecturer Account',
    'lecturer',
    TRUE,
    TRUE
);

INSERT INTO users (
    username,
    email,
    password_hash,
    full_name,
    role,
    verified,
    is_active
) VALUES (
    'user1',
    'user1@example.com',
    '$2b$12$lvNuz6SGvYtNUL9YkHRWue6ktphK5oQJ2y0fRrM438SK2rNDBYgqe',
    'Normal User 1',
    'user',
    TRUE,
    TRUE
);

INSERT INTO users (
    username,
    email,
    password_hash,
    full_name,
    role,
    verified,
    is_active
) VALUES (
    'user2',
    'user2@example.com',
    '$2b$12$Wd2w8gEwk3BiVmkEZod9fO9RmXw0Z2wNUGnxegafM22RkEhXa3H0.',
    'Normal User 2',
    'user',
    TRUE,
    TRUE
);

INSERT INTO users (
    username,
    email,
    password_hash,
    full_name,
    role,
    verified,
    is_active
) VALUES (
    'user3',
    'user3@example.com',
    '$2b$12$7HChj6NtX/weRQduIXelC.pQQxIugLsO0Tydf3K7wbAHxVHzKZYDW',
    'Normal User 3',
    'user',
    TRUE,
    TRUE
);

INSERT INTO users (
    username,
    email,
    password_hash,
    full_name,
    role,
    verified,
    is_active
) VALUES (
    'user4',
    'user4@example.com',
    '$2b$12$L06ptZV55Wt.LEBFLwg4Fu/0PwxGqqocL9k77dxvFGsybo/5QtwI.',
    'Normal User 4',
    'user',
    TRUE,
    TRUE
);

INSERT INTO users (
    username,
    email,
    password_hash,
    full_name,
    role,
    verified,
    is_active
) VALUES (
    'user5',
    'user5@example.com',
    '$2b$12$aGp9ne1PUsXicBbMLO3JiOz8tgRmAMmuSJveIcejV6Np0Ox3c98x2',
    'Normal User 5',
    'user',
    TRUE,
    TRUE
);

INSERT INTO users (
    username,
    email,
    password_hash,
    full_name,
    role,
    verified,
    is_active
) VALUES (
    'user6',
    'user6@example.com',
    '$2b$12$1apCwqhs4tPw//RmJWV3i.lnV65c2m.0.6.WBvxTUWnhU8e/fJpGO',
    'Normal User 6',
    'user',
    TRUE,
    TRUE
);

INSERT INTO users (
    username,
    email,
    password_hash,
    full_name,
    role,
    verified,
    is_active
) VALUES (
    'user7',
    'user7@example.com',
    '$2b$12$xGjaW8ZWQQPRmj0NHtsequCJpNJ971C30qdPF6z/H3bug2PHT4XpC',
    'Normal User 7',
    'user',
    TRUE,
    TRUE
);

INSERT INTO users (
    username,
    email,
    password_hash,
    full_name,
    role,
    verified,
    is_active
) VALUES (
    'user8',
    'user8@example.com',
    '$2b$12$Os8bh9CtFMMTIPtYimGIauHg85uu4CYC.tuCpUM3QGcFbRymppdeS',
    'Normal User 8',
    'user',
    TRUE,
    TRUE
);

INSERT INTO users (
    username,
    email,
    password_hash,
    full_name,
    role,
    verified,
    is_active
) VALUES (
    'user9',
    'user9@example.com',
    '$2b$12$dphBKrme9njqAs9EEzsQ2uc8am3cWnr/GrISUECjqalsUPxJj8HwK',
    'Normal User 9',
    'user',
    TRUE,
    TRUE
);

INSERT INTO users (
    username,
    email,
    password_hash,
    full_name,
    role,
    verified,
    is_active
) VALUES (
    'user10',
    'user10@example.com',
    '$2b$12$HLb.7EQDyZUyzV1h0FRpnOAKb0MEAsCQGprANIAGytfDpUjGmXlku',
    'Normal User 10',
    'user',
    TRUE,
    TRUE
);

INSERT INTO users (
    username,
    email,
    password_hash,
    full_name,
    role,
    verified,
    is_active
) VALUES (
    'student1',
    'student1@example.com',
    '$2b$12$GWUCir7wThP9.rL5SaFdpe26mBL61WNLnYE1KsgTAr4zT99.0IA4S',
    'Student Account 1',
    'student',
    TRUE,
    TRUE
);

INSERT INTO users (
    username,
    email,
    password_hash,
    full_name,
    role,
    verified,
    is_active
) VALUES (
    'student2',
    'student2@example.com',
    '$2b$12$5wLrVSA5rGODg9JYKGdVmeziVhSQGHzEI.jk3RgknsZH8mHereo9K',
    'Student Account 2',
    'student',
    TRUE,
    TRUE
);

INSERT INTO users (
    username,
    email,
    password_hash,
    full_name,
    role,
    verified,
    is_active
) VALUES (
    'student3',
    'student3@example.com',
    '$2b$12$rAfuSzK2dQKDkg231j/bMOyl5xMrmoKR5Apwe82KI4t6tq3.ag39u',
    'Student Account 3',
    'student',
    TRUE,
    TRUE
);

INSERT INTO users (
    username,
    email,
    password_hash,
    full_name,
    role,
    verified,
    is_active
) VALUES (
    'student4',
    'student4@example.com',
    '$2b$12$z2uxS0ICAUaMo.ERB4HRheFrEJ1AB71RscQrufJNIOdQApp...nO.',
    'Student Account 4',
    'student',
    TRUE,
    TRUE
);

INSERT INTO users (
    username,
    email,
    password_hash,
    full_name,
    role,
    verified,
    is_active
) VALUES (
    'student5',
    'student5@example.com',
    '$2b$12$XbHWYKRxSWvmzFzuqAT/J.u9qd2hJCXwzS.LsUsQpuRWfrfwbhNBm',
    'Student Account 5',
    'student',
    TRUE,
    TRUE
);

INSERT INTO users (
    username,
    email,
    password_hash,
    full_name,
    role,
    verified,
    is_active
) VALUES (
    'student6',
    'student6@example.com',
    '$2b$12$Q/aebAGORtBS1Wopkw4BuOzJVVNs7Ft/4Ue1tpoYfL4RCg5h6RGF2',
    'Student Account 6',
    'student',
    TRUE,
    TRUE
);

INSERT INTO users (
    username,
    email,
    password_hash,
    full_name,
    role,
    verified,
    is_active
) VALUES (
    'student7',
    'student7@example.com',
    '$2b$12$CL7J8GVC0k5etlhSzA7BTObJY432uNXa9IsfEK/OFh9SAWMTVKzYm',
    'Student Account 7',
    'student',
    TRUE,
    TRUE
);

INSERT INTO users (
    username,
    email,
    password_hash,
    full_name,
    role,
    verified,
    is_active
) VALUES (
    'student8',
    'student8@example.com',
    '$2b$12$ZxlP6vdhKh9CVRlPmtOwgOd04B7F.3AKXVc9Wlbsw7OUiPdSK/5oG',
    'Student Account 8',
    'student',
    TRUE,
    TRUE
);

INSERT INTO users (
    username,
    email,
    password_hash,
    full_name,
    role,
    verified,
    is_active
) VALUES (
    'student9',
    'student9@example.com',
    '$2b$12$HfOgUvhHW6SjCI0nObXkgepC8oJ7NXjejqEnjXHt/jbmqA9WJkGPu',
    'Student Account 9',
    'student',
    TRUE,
    TRUE
);

INSERT INTO users (
    username,
    email,
    password_hash,
    full_name,
    role,
    verified,
    is_active
) VALUES (
    'student10',
    'student10@example.com',
    '$2b$12$N0k9LcXtovtzsE47WeAy/eoO8yQuXT4t2IhNLjsHH4sCPf8NA5rT.',
    'Student Account 10',
    'student',
    TRUE,
    TRUE
);
