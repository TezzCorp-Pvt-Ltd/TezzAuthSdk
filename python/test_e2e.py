import sys
import time

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

from tezz_auth import TezzAuthClient, TezzAuthError, TezzConflictError


def main() -> None:
    print("\n======================================================")
    print("Running Python SDK End-to-End Test Suite")
    print("======================================================\n")

    assert TezzAuthClient.DEFAULT_BASE_URL == "https://account.tezzcorp.com"
    import os
    base_url = os.getenv("TEZZ_AUTH_URL", "http://localhost:3000")
    client = TezzAuthClient(base_url=base_url)
    timestamp = int(time.time() * 1000)
    test_email = f"python.sdk.{timestamp}@tezz.com"
    test_phone = f"+9197{str(timestamp)[-8:]}"
    password = "PythonSecure@2026"

    # 1. Fetch public key
    print("[1/6] Fetching RSA Public Key...")
    pub_key = client.get_public_key()
    assert "BEGIN PUBLIC KEY" in pub_key, "Invalid public key format"
    print("   [OK] Public key retrieved and cached.")

    # 2. Check availability
    print("[2/6] Checking availability...")
    is_avail = client.check_availability("email", test_email)
    assert is_avail is True, "Expected email to be available"
    print(f"   [OK] Email {test_email} is available.")

    # 3. Register user with encrypted credentials
    print("[3/6] Registering user with encrypted credentials...")
    reg = client.register(
        full_name="Python SDK User",
        email=test_email,
        phone_number=test_phone,
        password=password,
    )
    assert reg.success is True, f"Registration failed: {reg.message}"
    assert reg.token is not None, "JWT token missing"
    assert reg.user is not None, "User payload missing"
    print(f"   [OK] User registered! UUID: {reg.user.uuid}")
    print(f"   [OK] JWT Token: {reg.token[:32]}...")

    # 4. Multiple account conflict handling (409 conflict detection)
    print("[4/6] Testing multiple account conflict resolution (TezzConflictError)...")
    try:
        client.register(
            full_name="Duplicate Python User",
            email=test_email, # same email
            phone_number=f"+9196{str(timestamp)[-8:]}",
            password=password,
        )
        raise AssertionError("Expected registration to fail with TezzConflictError")
    except TezzConflictError as e:
        assert e.status_code == 409
        assert e.conflict_field == "email"
        print(f"   [OK] Caught TezzConflictError: conflict_field='{e.conflict_field}'")
        print("   [OK] Client can present user options: 'Sign In' vs 'Reset Password' vs 'Change Email'")

    # 5. Login
    print("[5/6] Logging in with encrypted credentials...")
    login = client.login(test_email, password)
    assert login.success is True, f"Login failed: {login.message}"
    assert login.user.full_name == "Python SDK User"
    print(f"   [OK] Authenticated successfully as {login.user.full_name}")

    # 6. Anti-enumeration check
    print("[6/6] Testing anti-enumeration error handling...")
    try:
        client.login(test_email, "WrongPassword@000")
        raise AssertionError("Expected login to fail")
    except TezzAuthError as e:
        assert e.status_code == 401
        assert e.message == "User email or password error"
        print(f"   [OK] Caught expected generic error: {e.message}")

    print("\n======================================================")
    print("Python SDK: ALL 6 TESTS PASSED FLAWLESSLY!")
    print("======================================================\n")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"\n[FAIL] Python SDK Test Failed: {exc}", file=sys.stderr)
        sys.exit(1)
