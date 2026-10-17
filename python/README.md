# tezz-auth (Python SDK)

Official Python SDK for Tezz Auth (`account.tezzcorp.com`).

- **End-to-End RSA-OAEP Encryption** - passwords encrypted via `cryptography` before transmission
- **Multiple Account Conflict Resolution** (`TezzConflictError`) with actionable choice branching
- **Anti-Enumeration & Per-User Lockout Protection**
- **Type Hints & Dataclass Models** (`TezzUser`, `AuthResponse`)
- **Automated Public Key Caching** with TTL
- **Session Management & Connection Pooling** via `requests.Session`

---

## Installation

```bash
pip install tezz-auth
```

---

## Quick Start

The SDK comes with `https://account.tezzcorp.com` pre-configured out of the box. You do not need to configure any URL.

```python
from tezz_auth import TezzAuthClient

# Automatically connects to https://account.tezzcorp.com
client = TezzAuthClient()
```

> **Optional Custom Endpoint**:
> If you are self-hosting or testing locally, you can optionally override `base_url`:
> ```python
> client = TezzAuthClient(base_url="https://auth.yourdomain.com")
> ```

---

## Complete Usage Examples

### 1. Check Availability (Email or Phone)
```python
is_available = client.check_availability("email", "rohit@example.com")
print(f"Email available: {is_available}")
```

### 2. User Registration & Multiple Account Conflict Resolution
When an account with the provided email or phone already exists, the SDK raises `TezzConflictError` containing `conflict_field` (`'email'`, `'phone'`, or `'both'`):

```python
from tezz_auth import (
    TezzAuthClient,
    TezzConflictError,
    TezzValidationError,
    TezzRateLimitError,
)

client = TezzAuthClient()

try:
    reg = client.register(
        full_name="Rohit Sharma",
        email="rohit@example.com",
        phone_number="+919876543210",
        password="SecurePassword@123",
        confirm_password="SecurePassword@123",
    )
    print(f"[OK] User registered! UUID: {reg.user.uuid}")
    print(f"[OK] JWT Token: {reg.token}")

except TezzConflictError as e:
    print(f"[WARN] Account conflict ({e.conflict_field}): {e.message}")

    # Guide user based on which credential matched:
    if e.conflict_field == "email":
        print("  1. Sign in with rohit@example.com")
        print("  2. Reset password via email OTP")
        print("  3. Register with a different email")
    elif e.conflict_field == "phone":
        print("  1. Sign in with +919876543210")
        print("  2. Reset password via SMS OTP")
        print("  3. Register with a different phone number")
    elif e.conflict_field == "both":
        print("  1. Sign in to existing account")
        print("  2. Recover password")

except TezzValidationError as e:
    print(f"Validation error: {e.errors}")
except TezzRateLimitError as e:
    print(f"Rate limited: wait {e.lockout_seconds}s")
```

### 3. User Login
```python
login = client.login("rohit@example.com", "SecurePassword@123")
print(f"Welcome back, {login.user.full_name}!")
print(f"Session Token: {login.token}")
```

### 4. Forgot Password Flow
```python
# Step 1: Request OTP (email or SMS)
forgot = client.forgot_password(identifier="rohit@example.com", channel="email")
print(forgot.message)

# Step 2: Verify OTP and update password
reset = client.reset_password(
    identifier="rohit@example.com",
    channel="email",
    otp_code="123456",
    new_password="BrandNewPassword@456",
    confirm_new_password="BrandNewPassword@456",
)
print(reset.message)  # "Password has been reset successfully. You can now log in."
```

### 5. Local RS256 JWT Verification (Offline)
```python
import jwt

# Get cached server public key
public_key_pem = client.get_public_key()

try:
    payload = jwt.decode(
        user_jwt_token,
        public_key_pem,
        algorithms=["RS256"],
    )
    print("User UUID:", payload["sub"])
    print("User Email:", payload["email"])
except jwt.InvalidTokenError as e:
    print("Invalid token:", e)
```

---

## Error Hierarchy

```
TezzAuthError (base)
 ├── TezzConflictError (status_code: 409, conflict_field: 'email' | 'phone' | 'both')
 ├── TezzRateLimitError (status_code: 429, remaining_attempts, lockout_seconds)
 └── TezzValidationError (status_code: 422, errors: List[dict])
```

---

## License
MIT (c) Tezz
