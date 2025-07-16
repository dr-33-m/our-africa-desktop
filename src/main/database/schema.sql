-- SQLite Schema for Virtual Varsity (Electron App)
-- Adapted from PostgreSQL schema to be compatible with SQLite while maintaining structure

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'student',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Modules table
CREATE TABLE IF NOT EXISTS modules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT NOT NULL, -- JSON string containing lessons, quizzes, estimatedTime
  version TEXT DEFAULT '1.0',
  author TEXT,
  difficulty_level TEXT DEFAULT 'beginner',
  tags TEXT, -- JSON array as string
  estimated_duration INTEGER DEFAULT 0, -- in minutes
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User progress table (module-level)
CREATE TABLE IF NOT EXISTS user_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  module_id INTEGER NOT NULL,
  progress_percentage INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  started_at DATETIME NULL,
  completion_date DATETIME NULL,
  total_time_spent INTEGER DEFAULT 0, -- in seconds
  last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (module_id) REFERENCES modules (id) ON DELETE CASCADE,
  UNIQUE (user_id, module_id)
);

-- Lesson progress table (lesson-level tracking)
CREATE TABLE IF NOT EXISTS lesson_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  module_id INTEGER NOT NULL,
  lesson_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  time_spent INTEGER DEFAULT 0, -- in seconds
  quiz_score INTEGER NULL, -- percentage score if lesson has quiz
  quiz_attempts INTEGER DEFAULT 0,
  completed_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (module_id) REFERENCES modules (id) ON DELETE CASCADE,
  UNIQUE (user_id, module_id, lesson_id)
);

-- Certificates table
CREATE TABLE IF NOT EXISTS certificates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  module_id INTEGER NOT NULL,
  certificate_code TEXT NOT NULL UNIQUE,
  certificate_data TEXT, -- JSON data for certificate (stored as TEXT in SQLite)
  issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  verified BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (module_id) REFERENCES modules (id) ON DELETE CASCADE,
  UNIQUE (user_id, module_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_module_id ON user_progress(module_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_module ON lesson_progress(user_id, module_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_code ON certificates(certificate_code);

-- Insert sample admin user (password: admin123)
INSERT OR IGNORE INTO users (id, username, email, password_hash, role) 
VALUES (1, 'admin', 'admin@ourafrica.com', '$2b$10$rZvKz8Y8qHqFj9K8GfF9.O8LxXvT9qEo8GXYZ.ABC123DEF456GHI', 'admin');
