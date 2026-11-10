-- =============================================================================
-- Breathe Better: Locality Feature Schema
-- Neon PostgreSQL Database Migration
-- =============================================================================

-- 1. Locality Users Table
CREATE TABLE IF NOT EXISTS locality_users (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  google_id VARCHAR(100) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_locality_users_email ON locality_users(email);
CREATE INDEX IF NOT EXISTS idx_locality_users_username ON locality_users(username);

-- 2. User Locality Preference Table
CREATE TABLE IF NOT EXISTS user_localities (
  user_id VARCHAR(64) PRIMARY KEY REFERENCES locality_users(id) ON DELETE CASCADE,
  locality_name VARCHAR(255) NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  radius_km DOUBLE PRECISION NOT NULL DEFAULT 5.0,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Pollution Threads Table (No category field needed)
CREATE TABLE IF NOT EXISTS pollution_threads (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES locality_users(id) ON DELETE CASCADE,
  username VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pollution_threads_coords ON pollution_threads(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_pollution_threads_user ON pollution_threads(user_id);

-- 4. Discussion Messages Table
CREATE TABLE IF NOT EXISTS pollution_messages (
  id SERIAL PRIMARY KEY,
  thread_id INTEGER REFERENCES pollution_threads(id) ON DELETE CASCADE,
  user_id VARCHAR(64) REFERENCES locality_users(id) ON DELETE CASCADE,
  username VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pollution_messages_thread ON pollution_messages(thread_id, created_at ASC);

-- 5. Thread Resolution Notifications Table
CREATE TABLE IF NOT EXISTS thread_resolve_notifications (
  id SERIAL PRIMARY KEY,
  thread_id INTEGER REFERENCES pollution_threads(id) ON DELETE CASCADE,
  creator_user_id VARCHAR(64) REFERENCES locality_users(id) ON DELETE CASCADE,
  notifier_user_id VARCHAR(64) REFERENCES locality_users(id) ON DELETE CASCADE,
  notifier_username VARCHAR(50) NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_thread_notifier UNIQUE (thread_id, notifier_user_id)
);

CREATE INDEX IF NOT EXISTS idx_thread_resolve_creator ON thread_resolve_notifications(creator_user_id);
