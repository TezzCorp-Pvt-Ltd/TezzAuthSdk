package com.tezz.auth;

import com.tezz.auth.exception.TezzAuthException;
import com.tezz.auth.exception.TezzConflictException;
import com.tezz.auth.model.AuthResponse;

public class TestRunner {
    public static void main(String[] args) {
        System.out.println("\n======================================================");
        System.out.println("Running Java SDK End-to-End Test Suite");
        System.out.println("======================================================\n");

        if (!TezzAuthClient.DEFAULT_BASE_URL.equals("https://account.tezzcorp.com")) {
            throw new RuntimeException("DEFAULT_BASE_URL mismatch in TezzAuthClient");
        }

        String testUrl = System.getenv("TEZZ_AUTH_URL") != null ? System.getenv("TEZZ_AUTH_URL") : "http://localhost:3000";
        TezzAuthClient client = new TezzAuthClient(testUrl);
        long timestamp = System.currentTimeMillis();
        String testEmail = "java.sdk." + timestamp + "@tezz.com";
        String testPhone = "+9196" + String.valueOf(timestamp).substring(String.valueOf(timestamp).length() - 8);
        String password = "JavaSecure@2026";

        try {
            // 1. Public key fetch
            System.out.println("[1/6] Fetching RSA Public Key...");
            String pubKey = client.getPublicKey();
            if (!pubKey.contains("BEGIN PUBLIC KEY")) {
                throw new RuntimeException("Invalid public key format");
            }
            System.out.println("   [OK] Public key fetched via Java 11 HttpClient.");

            // 2. Check availability
            System.out.println("[2/6] Checking availability...");
            boolean avail = client.checkAvailability("email", testEmail);
            if (!avail) throw new RuntimeException("Expected email to be available");
            System.out.println("   [OK] Email " + testEmail + " is available.");

            // 3. Register user with encrypted password
            System.out.println("[3/6] Registering user with encrypted credentials...");
            AuthResponse reg = client.register(
                "Java SDK User",
                testEmail,
                testPhone,
                password
            );
            if (!reg.isSuccess() || reg.getToken() == null) {
                throw new RuntimeException("Registration failed: " + reg.getMessage());
            }
            System.out.println("   [OK] User registered! UUID: " + reg.getUser().getUuid());
            System.out.println("   [OK] JWT Token: " + reg.getToken().substring(0, 32) + "...");

            // 4. Multiple account conflict handling (409 conflict detection)
            System.out.println("[4/6] Testing multiple account conflict resolution (TezzConflictException)...");
            try {
                client.register(
                    "Duplicate Java User",
                    testEmail, // duplicate email
                    "+9194" + String.valueOf(timestamp).substring(String.valueOf(timestamp).length() - 8),
                    password
                );
                throw new RuntimeException("Expected registration to fail with TezzConflictException");
            } catch (TezzConflictException e) {
                if (e.getStatusCode() == 409 && "email".equals(e.getConflictField())) {
                    System.out.println("   [OK] Caught TezzConflictException: conflictField='" + e.getConflictField() + "'");
                    System.out.println("   [OK] Client can present user options: 'Sign In' vs 'Reset Password' vs 'Change Email'");
                } else {
                    throw e;
                }
            }

            // 5. Login
            System.out.println("[5/6] Logging in with encrypted credentials...");
            AuthResponse login = client.login(testEmail, password);
            if (!login.isSuccess() || login.getToken() == null) {
                throw new RuntimeException("Login failed: " + login.getMessage());
            }
            System.out.println("   [OK] Authenticated successfully as " + login.getUser().getFullName());

            // 6. Anti-enumeration check
            System.out.println("[6/6] Testing anti-enumeration error handling...");
            try {
                client.login(testEmail, "WrongPassword@000");
                throw new RuntimeException("Expected login to fail");
            } catch (TezzAuthException e) {
                if (e.getStatusCode() == 401 && "User email or password error".equals(e.getMessage())) {
                    System.out.println("   [OK] Caught expected generic error: " + e.getMessage());
                } else {
                    throw e;
                }
            }

            System.out.println("\n======================================================");
            System.out.println("Java SDK: ALL 6 TESTS PASSED FLAWLESSLY!");
            System.out.println("======================================================\n");

        } catch (Exception e) {
            System.err.println("\n[FAIL] Java SDK Test Failed: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }
}
