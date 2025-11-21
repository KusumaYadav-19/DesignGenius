# Database Setup Guide

## PostgreSQL Configuration

### Environment Variables

Create a `.env` file in the `backend-web` directory with the following variables:

```env
# Server Configuration
PORT=3002

# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# PostgreSQL Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=figma_db
DB_USER=postgres
DB_PASSWORD=your_database_password_here
```

### Database Setup Steps

1. **Install PostgreSQL** (if not already installed)
   - Download from: https://www.postgresql.org/download/

2. **Create Database**
   ```sql
   CREATE DATABASE figma_db;
   ```

3. **Run Migration**
   ```bash
   psql -U postgres -d figma_db -f migrations/001_create_analyses_table.sql
   ```
   
   Or run the SQL directly in your PostgreSQL client:
   ```sql
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
   ```

4. **Install Dependencies**
   ```bash
   npm install
   ```

5. **Start Server**
   ```bash
   npm run dev
   ```

### Database Schema

The `analyses` table has the following structure:

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Auto-incrementing primary key (serial number) |
| `url` | TEXT | Figma file URL |
| `access_token` | TEXT | Figma access token |
| `session_id` | VARCHAR(255) | Unique session identifier |
| `file_key` | VARCHAR(255) | Figma file key (extracted from URL) |
| `page_id` | VARCHAR(255) | Figma page ID |
| `page_name` | VARCHAR(255) | Figma page name |
| `created_at` | TIMESTAMP | Timestamp when record was created |

### Testing Database Connection

The database connection is automatically tested when the server starts. You should see:
- `✅ Database connected successfully` - Connection successful
- `❌ Unexpected database error` - Connection failed (check your configuration)

### Notes

- The database connection uses a connection pool for better performance
- Failed database saves won't break the API response - errors are logged but the analysis continues
- The `session_id` column is UNIQUE to prevent duplicates

