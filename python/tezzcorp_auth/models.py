"""Data models and response types for TezzCorp Python SDK."""

from dataclasses import dataclass
from typing import Any, Dict, List, Optional


@dataclass
class TezzUser:
    uuid: str
    full_name: str
    email: str
    phone_number: str
    is_email_verified: bool
    is_phone_verified: bool

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "TezzUser":
        return cls(
            uuid=data.get("uuid", ""),
            full_name=data.get("full_name", ""),
            email=data.get("email", ""),
            phone_number=data.get("phone_number", ""),
            is_email_verified=bool(data.get("is_email_verified", False)),
            is_phone_verified=bool(data.get("is_phone_verified", False)),
        )


@dataclass
class AuthResponse:
    success: bool
    message: Optional[str] = None
    token: Optional[str] = None
    user: Optional[TezzUser] = None
    available: Optional[bool] = None
    remaining_attempts: Optional[int] = None
    lockout_seconds: Optional[int] = None
    raw: Optional[Dict[str, Any]] = None

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "AuthResponse":
        user_data = data.get("user")
        return cls(
            success=bool(data.get("success", False)),
            message=data.get("message"),
            token=data.get("token"),
            user=TezzUser.from_dict(user_data) if user_data else None,
            available=data.get("available"),
            remaining_attempts=data.get("remaining_attempts"),
            lockout_seconds=data.get("lockout_seconds"),
            raw=data,
        )
