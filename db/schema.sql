-- Schema Definition for Wlog

-- 1. villages
CREATE TABLE IF NOT EXISTS villages (
  id TEXT PRIMARY KEY,
  village_number REAL,
  name TEXT,
  characters TEXT, -- JSON array of strings
  character_set_id TEXT,
  created_at TEXT,
  _sling_loaded_at INTEGER
);

-- 2. posts
CREATE TABLE IF NOT EXISTS posts (
  village_id TEXT,
  character TEXT,
  day TEXT,
  sequence INTEGER,
  body TEXT,
  timestamp TEXT,
  post_type TEXT,
  source TEXT,
  created_at TEXT,
  PRIMARY KEY (village_id, day, sequence)
);

-- 3. avatars
CREATE TABLE IF NOT EXISTS avatars (
  name TEXT,
  avatar_url TEXT,
  set_id TEXT,
  PRIMARY KEY (name, set_id)
);

-- 4. character_sets
CREATE TABLE IF NOT EXISTS character_sets (
  id TEXT PRIMARY KEY
);

-- 5. jobs
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  type TEXT,
  payload TEXT, -- JSON
  status TEXT,
  result TEXT, -- JSON
  error TEXT,
  created_at TEXT,
  updated_at TEXT
);

-- 6. village_characters
CREATE TABLE IF NOT EXISTS village_characters (
  village_id TEXT,
  name TEXT,
  role TEXT,
  is_alive INTEGER,
  team TEXT,
  PRIMARY KEY (village_id, name)
);

-- 7. tags
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT
);

-- 8. village_tags
CREATE TABLE IF NOT EXISTS village_tags (
  village_id TEXT,
  tag_id TEXT,
  PRIMARY KEY (village_id, tag_id)
);

-- Insert default tags
INSERT OR IGNORE INTO tags (id, name) VALUES ('ai', 'AI村');
INSERT OR IGNORE INTO tags (id, name) VALUES ('shimon', '審問');
