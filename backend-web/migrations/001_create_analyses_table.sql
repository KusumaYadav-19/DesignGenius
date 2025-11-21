-- Create analyses table
CREATE TABLE IF NOT EXISTS analyses (
  id SERIAL PRIMARY KEY,
  url TEXT NOT NULL,
  access_token TEXT NOT NULL,
  session_id VARCHAR(255) NOT NULL UNIQUE,
  file_key VARCHAR(255),
  page_id VARCHAR(255),
  page_name VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index on session_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_analyses_session_id ON analyses(session_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);

-- Add comment to table
COMMENT ON TABLE analyses IS 'Stores Figma analysis records with URL, access token, session ID, and timestamp';

