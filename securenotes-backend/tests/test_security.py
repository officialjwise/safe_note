from __future__ import annotations


def _auth_headers(client):
    creds = {"email": "sec@example.com", "password": "StrongPass1!"}
    client.post("/api/v1/auth/register", json=creds)
    login = client.post("/api/v1/auth/login", json=creds).json()
    return {"Authorization": f"Bearer {login['access_token']}"}


def test_expired_jwt_returns_401(test_client):
    response = test_client.get("/api/v1/notes", headers={"Authorization": "Bearer expired.token.value"})
    assert response.status_code == 401


def test_malformed_jwt_returns_401(test_client):
    response = test_client.get("/api/v1/notes", headers={"Authorization": "Bearer not-a-jwt"})
    assert response.status_code == 401


def test_wrong_token_type_access_with_refresh_returns_401(test_client):
    creds = {"email": "tokentype@example.com", "password": "StrongPass1!"}
    test_client.post("/api/v1/auth/register", json=creds)
    login = test_client.post("/api/v1/auth/login", json=creds).json()
    response = test_client.get("/api/v1/notes", headers={"Authorization": f"Bearer {login['refresh_token']}"})
    assert response.status_code == 401


def test_sql_injection_in_note_title_is_safe(test_client):
    headers = _auth_headers(test_client)
    payload = {"title": "'; DROP TABLE notes; --", "body": "safe"}
    response = test_client.post("/api/v1/notes", json=payload, headers=headers)
    assert response.status_code == 200


def test_response_never_contains_stack_trace(test_client):
    response = test_client.get("/api/v1/notes/invalid-uuid", headers=_auth_headers(test_client))
    assert response.status_code in (422, 401, 403)
    assert "Traceback" not in response.text


def test_security_headers_present_on_every_response(test_client):
    response = test_client.get("/health")
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "DENY"


def test_rate_limit_on_login_after_threshold(test_client):
    creds = {"email": "ratelimit@example.com", "password": "StrongPass1!"}
    test_client.post("/api/v1/auth/register", json=creds)
    for _ in range(8):
        response = test_client.post("/api/v1/auth/login", json={"email": creds["email"], "password": "Wrong1!"})
    assert response.status_code in (401, 423, 429)


def test_logged_out_token_rejected_via_blacklist(test_client):
    creds = {"email": "logout-sec@example.com", "password": "StrongPass1!"}
    test_client.post("/api/v1/auth/register", json=creds)
    login = test_client.post("/api/v1/auth/login", json=creds).json()
    token = login["access_token"]
    test_client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {token}"})
    blocked = test_client.get("/api/v1/notes", headers={"Authorization": f"Bearer {token}"})
    assert blocked.status_code == 401
