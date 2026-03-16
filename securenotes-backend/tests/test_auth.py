from __future__ import annotations


def test_register_success(test_client, test_user):
    response = test_client.post("/api/v1/auth/register", json=test_user)
    assert response.status_code == 200


def test_register_duplicate_email_returns_409(test_client, test_user):
    test_client.post("/api/v1/auth/register", json=test_user)
    response = test_client.post("/api/v1/auth/register", json=test_user)
    assert response.status_code == 409


def test_register_weak_password_returns_422(test_client):
    response = test_client.post(
        "/api/v1/auth/register",
        json={"email": "weak@example.com", "password": "weakpass"},
    )
    assert response.status_code == 422


def test_login_success_returns_access_and_refresh_tokens(test_client, test_user):
    test_client.post("/api/v1/auth/register", json=test_user)
    response = test_client.post("/api/v1/auth/login", json=test_user)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data


def test_login_wrong_password_returns_401(test_client, test_user):
    test_client.post("/api/v1/auth/register", json=test_user)
    response = test_client.post(
        "/api/v1/auth/login",
        json={"email": test_user["email"], "password": "WrongPass1!"},
    )
    assert response.status_code == 401


def test_login_account_lockout_after_5_attempts(test_client, test_user):
    test_client.post("/api/v1/auth/register", json=test_user)
    for _ in range(5):
        test_client.post(
            "/api/v1/auth/login",
            json={"email": test_user["email"], "password": "WrongPass1!"},
        )
    response = test_client.post("/api/v1/auth/login", json=test_user)
    assert response.status_code in (401, 423)


def test_login_locked_account_returns_423_with_retry_after_header(test_client, test_user):
    test_client.post("/api/v1/auth/register", json=test_user)
    for _ in range(6):
        response = test_client.post(
            "/api/v1/auth/login",
            json={"email": test_user["email"], "password": "WrongPass1!"},
        )
    assert response.status_code == 423
    assert "Retry-After" in response.headers


def test_login_success_clears_failed_login_counter(test_client, test_user):
    test_client.post("/api/v1/auth/register", json=test_user)
    test_client.post(
        "/api/v1/auth/login",
        json={"email": test_user["email"], "password": "WrongPass1!"},
    )
    response = test_client.post("/api/v1/auth/login", json=test_user)
    assert response.status_code == 200


def test_refresh_success_rotates_token(test_client, test_user):
    test_client.post("/api/v1/auth/register", json=test_user)
    login = test_client.post("/api/v1/auth/login", json=test_user).json()
    response = test_client.post("/api/v1/auth/refresh", json={"refresh_token": login["refresh_token"]})
    assert response.status_code == 200
    refreshed = response.json()
    assert refreshed["refresh_token"] != login["refresh_token"]


def test_refresh_revoked_token_returns_401(test_client, test_user):
    test_client.post("/api/v1/auth/register", json=test_user)
    login = test_client.post("/api/v1/auth/login", json=test_user).json()
    test_client.post("/api/v1/auth/refresh", json={"refresh_token": login["refresh_token"]})
    response = test_client.post("/api/v1/auth/refresh", json={"refresh_token": login["refresh_token"]})
    assert response.status_code == 401


def test_refresh_expired_token_returns_401(test_client):
    response = test_client.post("/api/v1/auth/refresh", json={"refresh_token": "expired.or.invalid"})
    assert response.status_code == 401


def test_logout_blacklists_access_token(test_client, test_user):
    test_client.post("/api/v1/auth/register", json=test_user)
    login = test_client.post("/api/v1/auth/login", json=test_user).json()
    response = test_client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {login['access_token']}"},
    )
    assert response.status_code == 200


def test_logout_revokes_all_refresh_tokens(test_client, test_user):
    test_client.post("/api/v1/auth/register", json=test_user)
    first = test_client.post("/api/v1/auth/login", json=test_user).json()
    second = test_client.post("/api/v1/auth/login", json=test_user).json()
    test_client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {second['access_token']}"})
    response = test_client.post("/api/v1/auth/refresh", json={"refresh_token": first["refresh_token"]})
    assert response.status_code == 401


def test_blacklisted_token_rejected_on_next_request(test_client, test_user):
    test_client.post("/api/v1/auth/register", json=test_user)
    login = test_client.post("/api/v1/auth/login", json=test_user).json()
    token = login["access_token"]
    test_client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {token}"})
    response = test_client.get("/api/v1/notes", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 401
