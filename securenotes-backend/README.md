# SecureNotes Backend

Production-minded FastAPI backend for SecureNotes with Dockerized PostgreSQL, Redis, and pgAdmin.

## Start the stack

```bash
docker compose up -d
```

## Access pgAdmin

- URL: http://localhost:5050
- Email: value of PGADMIN_EMAIL in .env
- Password: value of PGADMIN_PASSWORD in .env

The SecureNotes PostgreSQL server is preconfigured.

## Generate secrets

```bash
openssl rand -hex 32
openssl rand -hex 32
```

Use one for JWT_SECRET_KEY and one for ENCRYPTION_PEPPER.

## Run migrations manually

```bash
docker compose exec api alembic upgrade head
```

## Run tests

```bash
pip install -r requirements-dev.txt
pytest tests/ -v --cov=app --cov-report=term-missing
```

## Audit dependencies

```bash
pip-audit -r requirements.txt
```

## Security notes

- JWT access tokens are short-lived.
- Refresh tokens are rotated and stored as hashes.
- Notes are encrypted at rest using AES-256-GCM.
- API enforces per-user data scope and ownership checks.
- Structured security events are logged without secrets.
- No user-controlled server-side URL fetching is implemented (SSRF surface absent).

## HTTPS

Terminate TLS at reverse proxy/load balancer in deployment environments and forward traffic to API over trusted internal network.
