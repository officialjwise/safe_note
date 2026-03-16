# pgAdmin Setup Guide - Secure Notes Database

## Quick Start

### pgAdmin Access

**URL**: `http://localhost:5050`

**Login Credentials:**
- **Email**: `admin@securenotes.dev`
- **Password**: `development_pgadmin_password`

## First Time Setup

### Step 1: Open pgAdmin
1. Start Docker containers: `docker-compose up -d`
2. Wait 10-15 seconds for services to be healthy
3. Open browser: `http://localhost:5050`
4. Enter credentials above

### Step 2: Register PostgreSQL Server in pgAdmin

The server connection may already be pre-registered (see docker/pgadmin/servers.json). If not:

1. Click **"Add New Server"** in the Dashboard
2. Fill in the **General** tab:
   - **Name**: `SecureNotes DB`
3. Click the **"Connection"** tab:
   - **Host name/address**: `db`  (Docker service name, NOT localhost)
   - **Port**: `5432`
   - **Maintenance database**: `securenotes_db`
   - **Username**: `securenotes_app`
   - **Password**: `development_app_password_1234567890`
   - **Save password**: ✅ Check this
4. Click **"Save"**

✅ **Now you're connected!**

## Navigating the Database

### View All Tables
1. In left sidebar: `SecureNotes DB` → `Schemas` → `public` → `Tables`
2. Right-click any table → **"View/Edit Data"** → **"All Rows"**

### Important Tables

#### 1. **users** table
```sql
SELECT * FROM users;
```
Columns:
- `id` - UUID primary key
- `email` - User email (plaintext, for login)
- `hashed_password` - bcrypt hash (safe to view)
- `created_at` - Account creation timestamp
- `is_active` - Whether account is active

#### 2. **notes** table
```sql
SELECT 
  id, 
  user_id, 
  title, 
  encrypted_body,  -- Base64 encoded (unreadable!)
  created_at,
  updated_at
FROM notes;
```
Columns:
- `id` - UUID primary key
- `user_id` - Who owns this note
- `title` - Plaintext title
- `encrypted_body` - **AES-256-GCM encrypted content** (cannot be read without user password)
- `created_at` - Creation timestamp
- `updated_at` - Last modified timestamp
- `is_deleted` - Soft delete flag

#### 3. **users_biometric_enrollments** table
```sql
SELECT * FROM users_biometric_enrollments;
```
Columns:
- `id` - UUID primary key
- `user_id` - User who enrolled biometric
- `biometric_type` - 'face_id', 'fingerprint', 'iris'
- `is_enabled` - Whether biometric auth is active
- `created_at` - Enrollment timestamp
- `updated_at` - Last updated timestamp

#### 4. **audit_logs** table
```sql
SELECT * FROM audit_logs;
```
Columns:
- `id` - UUID primary key
- `user_id` - Who performed the action
- `action` - 'login', 'logout', 'note_created', 'note_deleted', 'password_reset', etc
- `resource_id` - ID of affected resource (note_id, user_id, etc)
- `details` - JSON metadata about the action
- `ip_address` - Client IP
- `created_at` - When action occurred

## Common Queries

### Find All Notes for a User
```sql
SELECT id, title, created_at, updated_at
FROM notes
WHERE user_id = 'user-uuid-here'
  AND is_deleted = FALSE
ORDER BY updated_at DESC;
```

### Count Notes by User
```sql
SELECT 
  u.email,
  COUNT(n.id) as note_count
FROM users u
LEFT JOIN notes n ON u.id = n.user_id AND n.is_deleted = FALSE
GROUP BY u.id, u.email
ORDER BY note_count DESC;
```

### View Recent Login Activity
```sql
SELECT user_id, action, ip_address, created_at
FROM audit_logs
WHERE action = 'login'
ORDER BY created_at DESC
LIMIT 20;
```

### Check Biometric Enrollments
```sql
SELECT 
  u.email,
  be.biometric_type,
  be.is_enabled,
  be.created_at
FROM users_biometric_enrollments be
JOIN users u ON be.user_id = u.id
ORDER BY be.created_at DESC;
```

### View Password Reset History
```sql
SELECT 
  user_id,
  action,
  created_at,
  details
FROM audit_logs
WHERE action IN ('password_reset_requested', 'password_reset_confirmed')
ORDER BY created_at DESC;
```

## Important: Understanding Encrypted Data

### ❌ What You CANNOT Do
- **Cannot decrypt note content** by reading the database directly
- The `encrypted_body` column contains only encrypted data
- Example: `wGsj...truncated...9FxA==` is unreadable without the user's password

### ✅ What You CAN Do
1. **See encrypted blob size** - Indicates note length roughly
2. **Check metadata** - Title, timestamps, user ownership
3. **Verify encryption worked** - All notes have valid base64 in encrypted_body
4. **Track database integrity** - Ensure no corrupted records
5. **Audit user actions** - See audit_logs for who accessed what

### 🔐 To Decrypt a User's Notes
1. That user must be logged in their app
2. The notes are decrypted on their device
3. Their password is never sent to the backend
4. You cannot decrypt notes even with database access

## Performance Monitoring

### Check Database Size
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Monitor Active Connections
```sql
SELECT datname, usename, state, query
FROM pg_stat_activity
WHERE datname = 'securenotes_db';
```

### Check for Slow Queries
```sql
SELECT 
  query,
  calls,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

## Database Backup

### Backup PostgreSQL (from host machine)
```bash
# Backup to file
docker-compose exec -T db pg_dump \
  -U securenotes_app \
  -d securenotes_db \
  > secure_notes_backup_$(date +%Y%m%d_%H%M%S).sql

# Backup with gzip compression
docker-compose exec -T db pg_dump \
  -U securenotes_app \
  -d securenotes_db \
  | gzip > secure_notes_backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Restore from Backup
```bash
# Restore from .sql file
docker-compose exec -T db psql \
  -U securenotes_app \
  -d securenotes_db \
  < secure_notes_backup_20240115_143022.sql

# Restore from compressed file
gunzip -c secure_notes_backup_20240115_143022.sql.gz | \
  docker-compose exec -T db psql \
    -U securenotes_app \
    -d securenotes_db
```

## Troubleshooting

### Cannot Connect to Server
**Error**: "FATAL: remaining connection slots are reserved..."

```bash
# Restart the database
docker-compose restart db

# Or reset pgAdmin
docker-compose down
docker volume rm securenotes_pgadmin_data  # ⚠️ Deletes saved connections
docker-compose up -d
```

### Forgot Server Password
Check the `.env` file:
```bash
cat securenotes-backend/.env | grep APP_DB_PASSWORD
```

### pgAdmin Not Loading
```bash
# Check pgAdmin logs
docker-compose logs pgadmin

# Visit alternative port
http://localhost:5050  # Main
http://localhost:5051  # Alternate (if configured)
```

### Out of Disk Space
```bash
# Check Docker volumes
docker system df

# Clean unused Docker data
docker system prune -a
```

## Security Notes

### ⚠️ Development-Only Credentials
- These credentials are **ONLY for development**
- **DO NOT** use these in production
- **DO NOT** commit credentials to git (use .env)
- Change passwords before deploying to production

### 🔐 Production Setup
For production:
1. Generate strong random password:
   ```bash
   openssl rand -base64 32
   ```
2. Store in secure secret manager (AWS Secrets Manager, Azure Key Vault, etc)
3. Restrict pgAdmin to trusted IPs only
4. Use VPN for remote access
5. Enable SQL audit logging

### Access Control
```sql
-- Create read-only user for logs/monitoring
CREATE ROLE viewer WITH LOGIN PASSWORD 'strong_password';
GRANT CONNECT ON DATABASE securenotes_db TO viewer;
GRANT USAGE ON SCHEMA public TO viewer;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO viewer;
```

## Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [pgAdmin Documentation](https://www.pgadmin.org/docs/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
