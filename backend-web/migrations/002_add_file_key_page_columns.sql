-- Migration to add file_key, page_id, and page_name columns
-- Run this if you already have the analyses table created

ALTER TABLE analyses 
ADD COLUMN IF NOT EXISTS file_key VARCHAR(255),
ADD COLUMN IF NOT EXISTS page_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS page_name VARCHAR(255);

