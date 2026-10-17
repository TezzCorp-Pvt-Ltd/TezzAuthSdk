"""RSA-OAEP SHA-256 encryption using the cryptography library."""

import base64
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives.serialization import load_pem_public_key


def rsa_encrypt(public_key_pem: str, plaintext: str) -> str:
    """Encrypt plaintext string using server RSA public key with OAEP SHA-256 padding."""
    public_key = load_pem_public_key(public_key_pem.encode("utf-8"))
    encrypted_bytes = public_key.encrypt(
        plaintext.encode("utf-8"),
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None,
        ),
    )
    return base64.b64encode(encrypted_bytes).decode("utf-8")
