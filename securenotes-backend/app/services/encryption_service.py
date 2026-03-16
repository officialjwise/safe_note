from __future__ import annotations

import base64
from uuid import UUID

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.core.security import derive_user_key, random_nonce


def encrypt(plaintext: str, user_id: UUID) -> str:
    """Encrypt note content with AES-256-GCM.

    Security rationale:
    GCM provides confidentiality and integrity; modified ciphertext fails to decrypt.
    """

    key = derive_user_key(user_id)
    aesgcm = AESGCM(key)
    nonce = random_nonce(12)
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)
    packed = nonce + ciphertext
    return base64.urlsafe_b64encode(packed).decode("utf-8")


def decrypt(ciphertext_b64: str, user_id: UUID) -> str:
    key = derive_user_key(user_id)
    aesgcm = AESGCM(key)
    packed = base64.urlsafe_b64decode(ciphertext_b64.encode("utf-8"))
    nonce = packed[:12]
    ciphertext = packed[12:]
    try:
        plaintext = aesgcm.decrypt(nonce, ciphertext, None)
    except InvalidTag as exc:
        raise ValueError("Encrypted payload integrity check failed") from exc
    return plaintext.decode("utf-8")
