# PostgreSQL Setup Instructions (Windows)

## Step 1: Check if PostgreSQL is Installed

Open PowerShell or Command Prompt and run:

```bash
psql --version
```

If you see a version number, PostgreSQL is installed! Skip to Step 2.

If you get an error like `'psql' is not recognized`, you need to install PostgreSQL first.

### Install PostgreSQL (if not installed):

1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Or download installer: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
3. Run the installer and follow the setup wizard
4. **Remember the password you set for the `postgres` user!**
5. Make sure to check "Add PostgreSQL to PATH" during installation

---

## Step 2: Connect to PostgreSQL

Open PowerShell or Command Prompt and run:

```bash
psql -U postgres
```

You'll be prompted to enter the password for the `postgres` user (the one you set during installation).

**Alternative:** If you know your password and want to avoid the prompt:

```bash
psql -U postgres -d postgres
```

Then enter your password when prompted.

---

## Step 3: Create the Database

Once you're connected to PostgreSQL (you should see `postgres=#` prompt), run:

```sql
CREATE DATABASE figma_db;
```

You should see: `CREATE DATABASE`

Then exit the psql prompt:

```bash
\q
```

---

## Step 4: Run the Migration

Now, navigate to your project folder first:

```bash
cd "C:\Users\Syed Nawaz\Documents\Figma\figma-mcp-ai-web\backend-web"
```

Then run the migration:

```bash
psql -U postgres -d figma_db -f migrations\001_create_analyses_table.sql
```

Enter your password when prompted.

You should see output like:
```
CREATE TABLE
CREATE INDEX
CREATE INDEX
COMMENT
```

---

## Complete Setup (All Commands Together)

Here are all the commands in sequence:

```bash
# 1. Connect and create database
psql -U postgres

# (Enter your password)

# 2. Inside psql, run:
CREATE DATABASE figma_db;
\q

# 3. Navigate to project folder
cd "C:\Users\Syed Nawaz\Documents\Figma\figma-mcp-ai-web\backend-web"

# 4. Run migration
psql -U postgres -d figma_db -f migrations\001_create_analyses_table.sql
```

---

## Alternative: Using pgAdmin (GUI)

If you prefer a graphical interface:

1. **Open pgAdmin** (installed with PostgreSQL)
2. **Connect to PostgreSQL server** (you may need to enter the password you set)
3. **Right-click on "Databases"** → **Create** → **Database**
4. **Name it:** `figma_db`
5. **Click Save**
6. **Expand figma_db** → **Right-click "Schemas"** → **Right-click "public"** → **Query Tool**
7. **Copy and paste** the contents of `migrations/001_create_analyses_table.sql`
8. **Click Execute (F5)**

---

## Verify Setup

To verify everything is set up correctly:

```bash
psql -U postgres -d figma_db
```

Then run:

```sql
\dt
```

You should see the `analyses` table listed.

To see the table structure:

```sql
\d analyses
```

Then exit:

```bash
\q
```

---

## Troubleshooting

### Error: "psql: command not found"
- PostgreSQL is not installed or not in PATH
- Reinstall PostgreSQL and make sure to check "Add to PATH"
- Or use full path: `C:\Program Files\PostgreSQL\16\bin\psql.exe -U postgres`

### Error: "password authentication failed"
- You entered the wrong password
- Try connecting again with: `psql -U postgres`

### Error: "database does not exist"
- Make sure you created the database first
- Run: `CREATE DATABASE figma_db;` in psql

### Error: "could not connect to server"
- PostgreSQL service might not be running
- Open Services (Win + R, type `services.msc`)
- Find "postgresql-x64-XX" and make sure it's running

---

## Environment Variables

After setup, create a `.env` file in `backend-web` folder:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=figma_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here
```

Replace `your_postgres_password_here` with the password you set during PostgreSQL installation.

