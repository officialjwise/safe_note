from __future__ import annotations


def _register_and_login(client, email: str = "notes@example.com"):
    creds = {"email": email, "password": "StrongPass1!"}
    client.post("/api/v1/auth/register", json=creds)
    login = client.post("/api/v1/auth/login", json=creds).json()
    return creds, {"Authorization": f"Bearer {login['access_token']}"}


def test_create_note_success(test_client):
    _, headers = _register_and_login(test_client)
    response = test_client.post("/api/v1/notes", json={"title": "A", "body": "B"}, headers=headers)
    assert response.status_code == 200


def test_get_all_notes_only_returns_own_notes(test_client):
    _, h1 = _register_and_login(test_client, "u1@example.com")
    _, h2 = _register_and_login(test_client, "u2@example.com")
    test_client.post("/api/v1/notes", json={"title": "mine", "body": "secret"}, headers=h1)
    test_client.post("/api/v1/notes", json={"title": "other", "body": "private"}, headers=h2)
    response = test_client.get("/api/v1/notes", headers=h1)
    assert response.status_code == 200
    assert all(note["title"] != "other" for note in response.json())


def test_get_note_by_id_success(test_client):
    _, headers = _register_and_login(test_client)
    note = test_client.post("/api/v1/notes", json={"title": "one", "body": "two"}, headers=headers).json()
    response = test_client.get(f"/api/v1/notes/{note['id']}", headers=headers)
    assert response.status_code == 200


def test_get_note_owned_by_other_user_returns_403(test_client):
    _, h1 = _register_and_login(test_client, "owner@example.com")
    _, h2 = _register_and_login(test_client, "other@example.com")
    note = test_client.post("/api/v1/notes", json={"title": "owner", "body": "data"}, headers=h1).json()
    response = test_client.get(f"/api/v1/notes/{note['id']}", headers=h2)
    assert response.status_code == 403


def test_get_nonexistent_note_returns_403(test_client):
    _, headers = _register_and_login(test_client)
    response = test_client.get("/api/v1/notes/00000000-0000-0000-0000-000000000000", headers=headers)
    assert response.status_code == 403


def test_update_note_partial_update_only_changes_provided_fields(test_client):
    _, headers = _register_and_login(test_client)
    note = test_client.post("/api/v1/notes", json={"title": "Title", "body": "Body"}, headers=headers).json()
    updated = test_client.put(f"/api/v1/notes/{note['id']}", json={"title": "Changed"}, headers=headers).json()
    assert updated["title"] == "Changed"
    assert updated["body"] == "Body"


def test_update_note_owned_by_other_user_returns_403(test_client):
    _, h1 = _register_and_login(test_client, "u1-upd@example.com")
    _, h2 = _register_and_login(test_client, "u2-upd@example.com")
    note = test_client.post("/api/v1/notes", json={"title": "T", "body": "B"}, headers=h1).json()
    response = test_client.put(f"/api/v1/notes/{note['id']}", json={"title": "X"}, headers=h2)
    assert response.status_code == 403


def test_delete_note_success(test_client):
    _, headers = _register_and_login(test_client)
    note = test_client.post("/api/v1/notes", json={"title": "x", "body": "y"}, headers=headers).json()
    response = test_client.delete(f"/api/v1/notes/{note['id']}", headers=headers)
    assert response.status_code == 200


def test_delete_note_owned_by_other_user_returns_403(test_client):
    _, h1 = _register_and_login(test_client, "d1@example.com")
    _, h2 = _register_and_login(test_client, "d2@example.com")
    note = test_client.post("/api/v1/notes", json={"title": "x", "body": "y"}, headers=h1).json()
    response = test_client.delete(f"/api/v1/notes/{note['id']}", headers=h2)
    assert response.status_code == 403


def test_search_returns_only_own_matching_notes(test_client):
    _, headers = _register_and_login(test_client)
    test_client.post("/api/v1/notes", json={"title": "alpha", "body": "cat"}, headers=headers)
    test_client.post("/api/v1/notes", json={"title": "beta", "body": "dog"}, headers=headers)
    result = test_client.get("/api/v1/notes/search?q=cat", headers=headers)
    assert result.status_code == 200
    assert len(result.json()) == 1


def test_search_with_empty_query_returns_all_notes(test_client):
    _, headers = _register_and_login(test_client)
    test_client.post("/api/v1/notes", json={"title": "a", "body": "1"}, headers=headers)
    test_client.post("/api/v1/notes", json={"title": "b", "body": "2"}, headers=headers)
    result = test_client.get("/api/v1/notes/search?q=", headers=headers)
    assert result.status_code == 200
    assert len(result.json()) == 2


def test_access_notes_without_token_returns_401(test_client):
    response = test_client.get("/api/v1/notes")
    assert response.status_code == 401
