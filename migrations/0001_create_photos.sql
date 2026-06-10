CREATE TABLE IF NOT EXISTS photos (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  tags TEXT DEFAULT '[]',
  landscape INTEGER DEFAULT 0,
  status TEXT DEFAULT 'new',
  upload_date TEXT DEFAULT (datetime('now'))
);
