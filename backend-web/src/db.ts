import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

// Database connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'figma_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ Database connected successfully');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
});

export interface AnalysisRecord {
  id: number;
  url: string;
  access_token: string;
  session_id: string;
  file_key: string | null;
  page_id: string | null;
  page_name: string | null;
  created_at: Date;
}

/**
 * Create a new analysis record in the database
 */
export async function createAnalysis(
  url: string,
  accessToken: string,
  sessionId: string,
  fileKey: string,
  pageId: string,
  pageName: string
): Promise<AnalysisRecord> {
  try {
    const query = `
      INSERT INTO analyses (url, access_token, session_id, file_key, page_id, page_name, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING id, url, access_token, session_id, file_key, page_id, page_name, created_at
    `;
    
    const result = await pool.query(query, [url, accessToken, sessionId, fileKey, pageId, pageName]);
    return result.rows[0] as AnalysisRecord;
  } catch (error) {
    console.error('Error creating analysis record:', error);
    throw error;
  }
}

/**
 * Get an analysis record by session ID
 */
export async function getAnalysisBySessionId(
  sessionId: string
): Promise<AnalysisRecord | null> {
  try {
    const query = `
      SELECT id, url, access_token, session_id, file_key, page_id, page_name, created_at
      FROM analyses
      WHERE session_id = $1
    `;
    
    const result = await pool.query(query, [sessionId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting analysis record:', error);
    throw error;
  }
}

/**
 * Get all analysis records
 */
export async function getAllAnalyses(): Promise<AnalysisRecord[]> {
  try {
    const query = `
      SELECT id, url, access_token, session_id, file_key, page_id, page_name, created_at
      FROM analyses
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query);
    return result.rows as AnalysisRecord[];
  } catch (error) {
    console.error('Error getting all analyses:', error);
    throw error;
  }
}

/**
 * Get an analysis record by ID
 */
export async function getAnalysisById(id: number): Promise<AnalysisRecord | null> {
  try {
    const query = `
      SELECT id, url, access_token, session_id, file_key, page_id, page_name, created_at
      FROM analyses
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting analysis by ID:', error);
    throw error;
  }
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    await pool.query('SELECT NOW()');
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

export { pool };

