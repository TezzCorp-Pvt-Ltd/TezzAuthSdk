"""TezzAuthClient - Main entry point for Python SDK."""

import time
from typing import Optional
import requests

from .crypto import rsa_encrypt
from .exceptions import TezzAuthError, TezzRateLimitError, TezzValidationError, TezzConflictError
from .models import AuthResponse


class TezzAuthClient:
    """Client for connecting to TezzCorp Identity & Authentication System."""

    def __init__(
        self,
        base_url: str = "http://localhost:3000",
        timeout: int = 10,
        key_ttl: int = 3600,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.key_ttl = key_ttl

        self._cached_public_key: Optional[str] = None
        self._key_expires_at: float = 0
        self._session = requests.Session()

    def __enter__(self) -> "TezzAuthClient":
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        self._session.close()

    def get_public_key(self) -> str:
        """Fetch and cache server RSA public key."""
        now = time.time()
        if self._cached_public_key and now < self._key_expires_at:
            return self._cached_public_key

        url = f"{self.base_url}/api/v1/auth/public-key"
        resp = self._session.get(url, timeout=self.timeout)
        if not resp.ok:
            raise TezzAuthError(f"HTTP {resp.status_code}", resp.status_code, resp.text)

        data = resp.json()
        key = data.get("public_key")
        if not key:
            raise TezzAuthError("Public key missing from response", 500, data)

        self._cached_public_key = key
        self._key_expires_at = now + self.key_ttl
        return self._cached_public_key

    def register(
        self,
        full_name: str,
        email: str,
        phone_number: str,
        password: str,
        confirm_password: Optional[str] = None,
    ) -> AuthResponse:
        """Register a new user with client-side RSA encrypted password."""
        pub_key = self.get_public_key()
        confirm_pass = confirm_password or password

        password_encrypted = rsa_encrypt(pub_key, password)
        confirm_encrypted = rsa_encrypt(pub_key, confirm_pass)

        data = self._request(
            "/api/v1/auth/register",
            method="POST",
            json_body={
                "full_name": full_name,
                "email": email,
                "phone_number": phone_number,
                "password_encrypted": password_encrypted,
                "confirm_password_encrypted": confirm_encrypted,
            },
        )
        return AuthResponse.from_dict(data)

    def check_availability(self, type_: str, value: str) -> bool:
        """Check if an email or phone number is available."""
        data = self._request(
            "/api/v1/auth/check-availability",
            method="POST",
            json_body={"type": type_, "value": value},
        )
        return bool(data.get("available", False))

    def login(self, identifier: str, password: str) -> AuthResponse:
        """Authenticate user with RSA encrypted password."""
        pub_key = self.get_public_key()
        password_encrypted = rsa_encrypt(pub_key, password)

        data = self._request(
            "/api/v1/auth/login",
            method="POST",
            json_body={
                "identifier": identifier,
                "password_encrypted": password_encrypted,
            },
        )
        return AuthResponse.from_dict(data)

    def forgot_password(self, identifier: str, channel: str = "email") -> AuthResponse:
        """Initiate password recovery."""
        data = self._request(
            "/api/v1/auth/forgot-password",
            method="POST",
            json_body={"identifier": identifier, "channel": channel},
        )
        return AuthResponse.from_dict(data)

    def reset_password(
        self,
        identifier: str,
        channel: str,
        otp_code: str,
        new_password: str,
        confirm_new_password: Optional[str] = None,
    ) -> AuthResponse:
        """Verify OTP and update user password."""
        pub_key = self.get_public_key()
        confirm_pass = confirm_new_password or new_password

        new_password_encrypted = rsa_encrypt(pub_key, new_password)
        confirm_encrypted = rsa_encrypt(pub_key, confirm_pass)

        data = self._request(
            "/api/v1/auth/reset-password",
            method="POST",
            json_body={
                "identifier": identifier,
                "channel": channel,
                "otp_code": otp_code,
                "new_password_encrypted": new_password_encrypted,
                "confirm_new_password_encrypted": confirm_encrypted,
            },
        )
        return AuthResponse.from_dict(data)

    def _request(self, endpoint: str, method: str, json_body: dict) -> dict:
        url = f"{self.base_url}{endpoint}"
        try:
            resp = self._session.request(method, url, json=json_body, timeout=self.timeout)
            data = resp.json()
        except requests.RequestException as e:
            raise TezzAuthError(f"Network error: {str(e)}", 500)

        if not resp.ok:
            if resp.status_code == 429:
                raise TezzRateLimitError(
                    data.get("message", "Rate limit exceeded"),
                    data.get("remaining_attempts", 0),
                    data.get("lockout_seconds", 0),
                    data,
                )
            if resp.status_code == 409:
                raise TezzConflictError(
                    data.get("message", "Account already registered"),
                    data.get("conflict_field", "account"),
                    data,
                )
            if resp.status_code == 422:
                raise TezzValidationError(
                    data.get("message", "Validation failed"),
                    data.get("errors", []),
                    data,
                )
            raise TezzAuthError(
                data.get("message", f"HTTP {resp.status_code}"),
                resp.status_code,
                data,
            )

        return data
