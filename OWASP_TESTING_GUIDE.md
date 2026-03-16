# SecureNotes API Testing Guide - OWASP Top 10

## Overview

This guide explains how to use the Postman collection to test the SecureNotes API against OWASP Top 10 vulnerability categories.

## Setup Instructions

### 1. Import Collection into Postman

1. Open Postman
2. Click **"Import"** (top-left)
3. Choose **"Upload Files"**
4. Select: `SecureNotes_API_Testing_Collection.postman_collection.json`
5. Click **"Import"**

### 2. Configure Environment Variables

Create a new Postman Environment with these variables:

```javascript
{
  "access_token": "your_jwt_token_here",
  "refresh_token": "your_refresh_token_here",
  "note_id": "uuid-of-test-note"
}
```

**How to populate:**
1. Run test **1.4 Login (Valid)** with your test credentials
2. Copy `access_token` from response
3. Copy `refresh_token` from response
4. Paste into environment variables above
5. Run test **2.1 Create Note** to get a note_id
6. Save that note_id to environment

## Testing Methodology

### Phase 1: Baseline Testing (Legitimate Use Cases)

These tests verify the API works correctly:
- **1.1** - Register New User (Valid)
- **1.4** - Login (Valid)
- **2.1** - Create Note (Valid)
- **2.4** - Get All Notes (Valid)
- **2.8** - Update Note (Valid)

**Expected Results**: ✅ All succeed with 2xx status codes

---

## OWASP Top 10 Vulnerability Categories

### **OWASP #1: Broken Authentication & Session Management**

Tests targeting authentication weaknesses:

#### 1.2 - Weak Password Validation
- **Test**: Register with password `password123` (no uppercase, special char)
- **Expected Result**: ❌ 400 Bad Request
- **Security Check**: Ensures password policy enforcement
- **Payload**:
  ```json
  {"email": "weak@example.com", "password": "password123"}
  ```

#### 1.3 - XSS in Email Field
- **Test**: Register with HTML/JS in email
- **Expected Result**: ❌ 400 Bad Request (input sanitization)
- **Security Check**: Prevents stored XSS via email
- **Payload**:
  ```json
  {"email": "<script>alert('xss')</script>@example.com", "password": "SecurePass123!"}
  ```

#### 1.5 - Brute Force Attack
- **Test**: Send 10+ login attempts with wrong password rapidly
- **Expected Result**: ❌ 429 Too Many Requests (after rate limit)
- **Security Check**: Rate limiting prevents brute force
- **Note**: Default limit is ~5 attempts per minute per IP

#### 1.6 - SQL Injection in Login
- **Test**: Login with `admin' OR '1'='1'`
- **Expected Result**: ❌ 401 Unauthorized
- **Security Check**: Parameterized queries prevent SQL injection
- **Payload**:
  ```json
  {"email": "admin' OR '1'='1", "password": "anything"}
  ```

#### 1.8 - Invalid Refresh Token
- **Test**: Use malformed refresh token
- **Expected Result**: ❌ 401 Unauthorized
- **Security Check**: Token validation prevents session hijacking
- **Payload**:
  ```json
  {"refresh_token": "invalid_token_here"}
  ```

**Mitigation Implemented**:
- ✅ JWT tokens with secure signing (HS256)
- ✅ Access token expiry (15 mins)
- ✅ Refresh token rotation
- ✅ Rate limiting on auth endpoints
- ✅ Strong password requirements

---

### **OWASP #2: Cryptographic Failures**

Tests targeting encryption and data protection weaknesses:

#### 7.1 - Password Not Hashed
- **Test**: Login and inspect backend logs/database
- **Expected Result**: ❌ Password should be bcrypt hashed (not plaintext)
- **Security Check**: Verifies password hashing
- **How to Verify**:
  1. Login successfully
  2. Query pgAdmin: `SELECT hashed_password FROM users WHERE email='testuser@example.com'`
  3. Should see bcrypt hash like: `$2b$12$...truncated...`

#### 7.2 - Note Encryption
- **Test**: Create note and check encrypted storage
- **Expected Result**: ❌ Note body should be encrypted in database
- **Security Check**: Verifies AES-256-GCM encryption
- **How to Verify**:
  1. Create note with text: "This is secret"
  2. Query pgAdmin: `SELECT encrypted_body FROM notes LIMIT 1`
  3. Should see base64 like: `wGsj...truncated...9FxA==` (unreadable)

**Mitigation Implemented**:
- ✅ bcrypt hashing for passwords (10 rounds)
- ✅ AES-256-GCM encryption for note content
- ✅ User-specific keys derived from user_id + pepper
- ✅ Nonce generation for each encryption
- ✅ Authentication tags prevent tampering

---

### **OWASP #3: Injection**

Tests targeting code injection vulnerabilities:

#### 4.1 - SQL Injection in Login
- **Test**: `email: "admin' OR '1'='1' -- "`
- **Expected Result**: ❌ 401 Unauthorized
- **Security Check**: Parameterized queries prevent SQL injection
- **Technical Details**: Using async SQLAlchemy ORM with parameterized queries

#### 4.2 - SQL Injection (Union-Based)
- **Test**: `email: "test' UNION SELECT * FROM users -- "`
- **Expected Result**: ❌ 401 Unauthorized
- **Security Check**: ORM prevents unchecked queries

#### 4.3 - Command Injection
- **Test**: Note title: `"; rm -rf /"`
- **Expected Result**: ❌ Stored as plaintext (no shell execution)
- **Security Check**: Python strings don't execute shell commands

**Mitigation Implemented**:
- ✅ SQLAlchemy ORM (prevents direct SQL)
- ✅ Parameterized queries
- ✅ Input validation on all user inputs
- ✅ No shell command execution

---

### **OWASP #4: Insecure Design**

Tests targeting missing security controls:

#### 2.2 - SQL Injection in Note Title
- **Test**: `title: "'; DROP TABLE notes; --"`
- **Expected Result**: ❌ 400 Bad Request or safely stored as plaintext
- **Security Check**: ORM prevents execution

#### 11.1 - Information Disclosure
- **Test**: Access invalid endpoint `/api/v1/invalid-endpoint`
- **Expected Result**: ❌ 404 Not Found (generic message)
- **Security Check**: No stack traces or DB errors exposed
- **Expected** message: `{"detail": "Not found"}` (not full traceback)

#### 11.2 - Error Message Leakage
- **Test**: Send malformed JSON
- **Expected Result**: ❌ 422 Unprocessable Entity (generic error)
- **Security Check**: No sensitive info in error messages

**Mitigation Implemented**:
- ✅ Input validation schemas (Pydantic)
- ✅ Generic error messages in production
- ✅ Detailed logging (server-side only)
- ✅ Rate limiting on failed requests

---

### **OWASP #5: Broken Access Control (IDOR)**

Tests targeting authorization flaws:

#### 3.1 - No Authentication Token
- **Test**: GET /api/v1/notes without Authorization header
- **Expected Result**: ❌ 401 Unauthorized
- **Security Check**: Requires JWT token for protected endpoints

#### 3.2 - Expired Token
- **Test**: Use 2+ year old JWT
- **Expected Result**: ❌ 401 Unauthorized
- **Security Check**: Token validation (exp claim checking)

#### 3.3 - Malformed Token
- **Test**: Bearer token: `invalid.token.here`
- **Expected Result**: ❌ 401 Unauthorized
- **Security Check**: JWT signature verification fails

#### 3.4 - IDOR (Access Other User's Data)
- **Test**: GET `/api/v1/users/different-user-id/notes`
- **Expected Result**: ❌ 403 Forbidden
- **Security Check**: User can only access their own resources
- **Code Check**: Backend verifies `note.user_id == current_user.id`

#### 2.6 - IDOR (Different Note)
- **Test**: GET `/api/v1/notes/other_users_note_id` with your token
- **Expected Result**: ❌ 403 Forbidden or 404 Not Found
- **Security Check**: Cannot access notes you don't own

**Mitigation Implemented**:
- ✅ JWT token required for all protected endpoints
- ✅ User ownership checks on all resources
- ✅ Token expiry validation
- ✅ Signature verification
- ✅ Role-based access control ready for future use

---

### **OWASP #6: Vulnerable & Outdated Components**

Tests targeting dependency vulnerabilities:

**How to Check**:
```bash
# Check Python dependencies
pip list --outdated

# Check npm/JavaScript dependencies
npm audit

# Backend scan
docker run --rm -v /path/to/requirements.txt:/requirements.txt \
  aquasec/trivy config /requirements.txt
```

**Current Stack**:
- Python 3.11 ✅ (actively maintained)
- FastAPI 0.104+ ✅ (latest security patches)
- SQLAlchemy 2.0+ ✅ (latest)
- PostgreSQL 16 ✅ (latest)
- React Native ~54.0.0 ✅ (Expo maintained)

---

### **OWASP #7: Cross-Site Scripting (XSS)**

Tests targeting XSS vulnerabilities:

#### 1.3 - Stored XSS in Registration
- **Test**: Register with `<script>alert('xss')</script>@example.com`
- **Expected Result**: ❌ 400 Bad Request (email validation fails)
- **Security Check**: Input validation prevents XSS

#### 2.3 - Stored XSS in Note Body
- **Test**: Create note with `<img src=x onerror='alert("XSS")'>`
- **Expected Result**: ✅ Note is encrypted (XSS dies in encryption)
- **Security Check**: No DOM = no XSS execution
- **Verification**:
  1. Note is stored encrypted in DB
  2. Frontend displays it as plaintext in editor
  3. Preview renders markdown safely (no `dangerouslySetInnerHTML`)

**Mitigation Implemented**:
- ✅ Input validation (email, text fields)
- ✅ No `eval()` or `innerHTML` usage
- ✅ Pydantic schema validation
- ✅ React sanitization (default safe rendering)

---

### **OWASP #8: Software & Data Integrity Failures**

Tests targeting integrity violations:

#### Verify Signed JWTs
- **Test**: Decode JWT at `jwt.io`
- **Expected Result**: ✅ Header: `{"alg":"HS256", "typ":"JWT"}`
- **Security Check**: Signed tokens prevent tampering
- **How JWT Payload Looks**:
  ```json
  {
    "sub": "user-uuid",
    "email": "user@example.com",
    "iat": 1705350000,
    "exp": 1705350900,
    "type": "access"
  }
  ```

#### Verify Git Integrity
- **Test**: Check commit signatures
- **Expected Result**: All commits should have GPG signature
- **Command**: `git log --show-signature`

---

### **OWASP #9: Logging & Monitoring Failures**

Tests targeting incomplete logging:

#### Check Audit Logs
- **Test**: Login, create note, delete note → check audit_logs
- **Expected Results**:
  ```sql
  SELECT action, user_id, created_at, details FROM audit_logs
  WHERE user_id = 'test-user-id'
  ORDER BY created_at DESC LIMIT 10;
  ```
- Should show: `login`, `note_created`, `note_deleted`, etc

#### Verify No Sensitive Logging
- **Test**: Check backend logs (docker logs)
- **Expected Result**: ❌ Passwords should NOT appear
- **Command**: `docker-compose logs api | grep -i password`
- **Should return**: Nothing (no password logs)

**Mitigation Implemented**:
- ✅ Comprehensive audit logging
- ✅ Request ID tracking for debugging
- ✅ IP address logging for security
- ✅ Failed auth attempt logging
- ✅ Sensitive data never logged

---

### **OWASP #10: Server-Side Request Forgery (SSRF)**

Tests targeting SSRF vulnerabilities:

#### Check Email Service
- **Test**: Request password reset → check if email was sent
- **Expected Result**: ✅ Email sent to user inbox
- **Security Check**: SSRF prevention
  - Uses authenticated SMTP connection
  - Only sends to verified addresses
  - No URL parsing from user input

**Mitigation Implemented**:
- ✅ Email to authenticated Gmail SMTP
- ✅ No URL parsing from user input
- ✅ Whitelist of allowed email domains (optional)
- ✅ Rate limiting on email sends

---

## Testing Workflow

### Step-by-Step Process

1. **Setup Phase**
   ```
   1.1 Register New User → get credentials
   1.4 Login → get tokens
   Save tokens to environment variables
   ```

2. **Happy Path Testing**
   ```
   2.1 Create Note → get note_id
   2.4 Get All Notes
   2.5 Get Note by ID
   2.8 Update Note
   2.9 Delete Note
   ```

3. **Security Testing**
   ```
   Run each vulnerability test in sequence
   Document the results
   Compare with expected security behavior
   ```

4. **Edge Cases**
   ```
   3.1 No Auth Token
   3.2 Expired Token
   4.1 SQL Injection
   5.1 Brute Force Attempts
   ```

## Expected Results Summary

| Category | Test | Expected Status | Security Check |
|----------|------|-----------------|------------------|
| Auth | Weak Password | 400 | ✅ Validation |
| Auth | SQL Injection | 401 | ✅ Parameterized |
| Auth | Brute Force | 429 | ✅ Rate Limited |
| Access | No Token | 401 | ✅ Authentication |
| Access | IDOR Act | 403 | ✅ Authorization |
| Data | Plaintext Password | ❌ Hashed | ✅ Encryption |
| Data | Note in DB | ❌ Encrypted | ✅ AES-256-GCM |
| Injection | SQL Inject | 401/400 | ✅ ORM |
| XSS | Script Tag | 400/Encrypted | ✅ Sanitized |
| Errors | Invalid Endpoint | 404 | ✅ Generic Message |

## Performance Benchmarks

Add these tests to measure performance:

```javascript
// In Postman pre-request script
pm.environment.set("startTime", Date.now());

// In post-response script
let startTime = pm.environment.get("startTime");
let responseTime = Date.now() - startTime;
console.log(`Response time: ${responseTime}ms`);

// Assertions
pm.test("Response time < 200ms", () => {
  pm.expect(responseTime).to.be.below(200);
});
```

## Load Testing with Artillery

For load testing (DoS prevention):

```bash
# Install Artillery
npm install -g artillery

# Create load-test.yml
cat > load-test.yml << EOF
config:
  target: "http://192.168.1.191:8000"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Ramp up"
    - duration: 60
      arrivalRate: 100
      name: "Stress"

scenarios:
  - name: "GET Notes"
    flow:
      - get:
          url: "/api/v1/notes"
          headers:
            Authorization: "Bearer {{ access_token }}"
EOF

# Run load test
artillery run load-test.yml --target http://192.168.1.191:8000
```

**Expected Result**: Backend should handle 50+ req/sec with <500ms latency

## Remediation Workflow

If a test fails:

1. **Document the Finding**
   - Test name and category
   - Actual vs Expected result
   - Severity (Critical/High/Medium/Low)

2. **Find Root Cause**
   - Check backend logs
   - Review code for vulnerable pattern
   - Check database state

3. **Implement Fix**
   - Write code fix
   - Add unit tests
   - Verify in development

4. **Re-test**
   - Run the same Postman test
   - Verify it now passes
   - Run full test suite

5. **Document Remediation**
   - Note the fix applied
   - List files changed
   - Link to commit/PR

## Additional Resources

- 📚 [OWASP Top 10 2021](https://owasp.org/Top10/)
- 🔒 [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- 🛡️ [CWE Top 25](https://cwe.mitre.org/top25/)
- 📖 [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- 🔐 [NIST Cryptographic Standards](https://csrc.nist.gov/projects/cryptographic-standards-and-guidelines/)
