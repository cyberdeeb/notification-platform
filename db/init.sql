CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (id, name, email, phone) VALUES
('user_123', 'Alice Johnson', 'alice@example.com', '+10000000001'),
('user_456', 'Bob Smith', 'bob@example.com', '+10000000002'),
('user_789', 'Charlie Brown', 'charlie@example.com', '+10000000003'),
('user_101', 'David Wilson', 'david@example.com', '+10000000004');