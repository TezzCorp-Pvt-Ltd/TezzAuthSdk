"""Custom exception classes for TezzCorp Python SDK."""

from typing import Any, Dict, List, Optional


class TezzAuthError(Exception):
    """Base exception for all TezzCorp authentication errors."""

    def __init__(self, message: str, status_code: int = 500, response: Optional[Any] = None) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.response = response


class TezzRateLimitError(TezzAuthError):
    """Raised when request is throttled or locked out."""

    def __init__(
        self,
        message: str,
        remaining_attempts: int,
        lockout_seconds: int,
        response: Optional[Any] = None
    ) -> None:
        super().__init__(message, 429, response)
        self.remaining_attempts = remaining_attempts
        self.lockout_seconds = lockout_seconds


class TezzValidationError(TezzAuthError):
    """Raised when field validation fails."""

    def __init__(
        self,
        message: str,
        errors: Optional[List[Dict[str, Any]]] = None,
        response: Optional[Any] = None
    ) -> None:
        super().__init__(message, 422, response)
        self.errors = errors or []


class TezzConflictError(TezzAuthError):
    """Raised when account already exists (HTTP 409 conflict)."""

    def __init__(
        self,
        message: str,
        conflict_field: str = "account",
        response: Optional[Any] = None
    ) -> None:
        super().__init__(message, 409, response)
        self.conflict_field = conflict_field
