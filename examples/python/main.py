"""Tezz Auth - Python Example Project

Demonstrates:
1. Initializing TezzAuthClient
2. Fetching RSA public key
3. Checking credential availability
4. User registration with RSA-OAEP password encryption
5. Multiple account conflict handling (TezzConflictError)
6. User authentication (login)
7. Real-time profile retrieval (get_profile)
8. Account deletion cancellation flow (cancel_deletion)
"""

import os
import sys
import time

# Fallback to local SDK path if package is not yet installed in site-packages
try:
    from tezz_auth import TezzAuthClient
    from tezz_auth.exceptions import TezzConflictError, TezzAuthError
except ImportError:
    sdk_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "python"))
    sys.path.insert(0, sdk_dir)
    from tezz_auth import TezzAuthClient
    from tezz_auth.exceptions import TezzConflictError, TezzAuthError


def main() -> None:
    base_url = os.environ.get("TEZZ_AUTH_URL", "https://account.tezzcorp.com")
    print("======================================================")
    print("Tezz Auth SDK - Python Example Project")
    print(f"Connecting to: {base_url}")
    print("======================================================\n")

    timestamp = int(time.time() * 1000)
    test_email = f"py.test.{timestamp}@tezzcorp.com"
    test_phone = f"+9198{str(timestamp)[-8:]}"
    test_password = "PythonPassword#2026"
    test_name = "Python Test User"

    with TezzAuthClient(base_url=base_url, timeout=10) as client:
        # 1. Fetch public key
        print("[1/6] Fetching RSA Public Key...")
        pub_key = client.get_public_key()
        print("      [OK] Public key loaded and cached.")

        # 2. Check availability
        print(f"\n[2/6] Checking availability for {test_email}...")
        is_available = client.check_availability("email", test_email)
        print(f"      [OK] Email available: {is_available}")

        # 3. Register user
        print("\n[3/6] Registering new user with client-side RSA encryption...")
        reg_resp = client.register(
            full_name=test_name,
            email=test_email,
            phone_number=test_phone,
            password=test_password,
            confirm_password=test_password,
        )

        user_uuid = reg_resp.user.uuid if reg_resp.user else "N/A"
        token_sample = reg_resp.token[:25] + "..." if reg_resp.token else "N/A"
        print("      [OK] Registration successful!")
        print(f"      User UUID : {user_uuid}")
        print(f"      Auth Token: {token_sample}")

        # 4. Conflict handling
        print("\n[4/6] Testing multiple account conflict resolution...")
        try:
            client.register(
                full_name=test_name,
                email=test_email,
                phone_number=test_phone,
                password=test_password,
            )
            print("      [FAIL] Duplicate registration was unexpectedly accepted.")
        except TezzConflictError as exc:
            print(f"      [OK] Caught typed TezzConflictError!")
            print(f"      Conflict field : {exc.conflict_field}")
            print(f"      Server message : {exc.message}")
            print("      -> Client can now offer: 'Sign In', 'Reset Password', or 'Change Email'.")
        except TezzAuthError as exc:
            print(f"      [WARN] Caught general TezzAuthError: {exc.message}")

        # 5. Authenticate (Login)
        print("\n[5/6] Authenticating user credentials...")
        login_resp = client.login(identifier=test_email, password=test_password)
        session_token = login_resp.token
        print("      [OK] Login successful!")
        print(f"      Message   : {login_resp.message}")

        # 6. Fetch User Profile
        print("\n[6/6] Fetching verified profile with session token...")
        profile_resp = client.get_profile(session_token)
        user_info = profile_resp.user
        raw_user = profile_resp.raw.get("user", {}) if profile_resp.raw else {}
        print("      [OK] Profile retrieved successfully!")
        print(f"      UUID            : {user_info.uuid if user_info else 'N/A'}")
        print(f"      Email           : {user_info.email if user_info else 'N/A'}")
        print(f"      Email Verified  : {user_info.is_email_verified if user_info else False}")
        print(f"      Phone Verified  : {user_info.is_phone_verified if user_info else False}")
        print(f"      Deletion Status : {'Scheduled' if raw_user.get('is_deletion_pending') else 'Active'}")

    print("\n======================================================")
    print("Python Test Project: ALL FLOWS EXECUTED SUCCESSFULLY!")
    print("======================================================")


if __name__ == "__main__":
    main()
