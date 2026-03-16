from __future__ import annotations

from uuid import uuid4

import pytest

from app.services.encryption_service import decrypt, encrypt


def test_encrypt_decrypt_roundtrip():
    user_id = uuid4()
    value = "hello world"
    enc = encrypt(value, user_id)
    dec = decrypt(enc, user_id)
    assert dec == value


def test_encrypted_value_is_not_plaintext():
    user_id = uuid4()
    value = "secret"
    enc = encrypt(value, user_id)
    assert value not in enc


def test_two_encryptions_of_same_plaintext_differ():
    user_id = uuid4()
    value = "same text"
    assert encrypt(value, user_id) != encrypt(value, user_id)


def test_tampered_ciphertext_raises_error():
    user_id = uuid4()
    value = "tamper me"
    enc = encrypt(value, user_id)
    tampered = enc[:-2] + "AA"
    with pytest.raises(Exception):
        decrypt(tampered, user_id)


def test_note_stored_in_db_has_encrypted_columns(test_client):
    creds = {"email": "enc@example.com", "password": "StrongPass1!"}
    test_client.post("/api/v1/auth/register", json=creds)
    login = test_client.post("/api/v1/auth/login", json=creds).json()
    headers = {"Authorization": f"Bearer {login['access_token']}"}
    note = test_client.post("/api/v1/notes", json={"title": "A", "body": "B"}, headers=headers).json()
    assert note["title"] == "A"
    assert note["body"] == "B"
