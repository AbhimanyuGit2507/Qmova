-- Update password to School@2026 for Small Students demo accounts
UPDATE "User"
SET password = '$2b$10$fIY80KjnvkHbDzjuy9bea.FCnTKCqlfLej72cLr7pnL1JnFVGod/6'
WHERE email IN (
    'smallstudentspreschool@gmail.com',
    'events@schooldemo.co.za',
    'events@yqbuddy.com'
);
