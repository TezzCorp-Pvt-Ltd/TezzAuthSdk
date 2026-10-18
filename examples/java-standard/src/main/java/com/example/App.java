package com.example;

import com.tezz.auth.TezzAuthClient;
import com.tezz.auth.exception.TezzAuthException;
import com.tezz.auth.exception.TezzConflictException;
import com.tezz.auth.model.AuthResponse;

public class App {
    public static void main(String[] args) {
        String envUrl = System.getenv("TEZZ_AUTH_URL");
        String baseUrl = (envUrl != null && !envUrl.isBlank()) ? envUrl : "https://account.tezzcorp.com";

        System.out.println("======================================================");
        System.out.println("Tezz Auth SDK - Java Standard Example Project");
        System.out.println("Connecting to: " + baseUrl);
        System.out.println("======================================================\n");

        TezzAuthClient client = new TezzAuthClient(baseUrl);

        long timestamp = System.currentTimeMillis();
        String testEmail = "java.test." + timestamp + "@tezzcorp.com";
        String testPhone = "+9198" + String.valueOf(timestamp).substring(String.valueOf(timestamp).length() - 8);
        String testPassword = "JavaPassword#2026";
        String testFullName = "Java Test User";

        try {
            // 1. Fetch public key
            System.out.println("[1/6] Fetching RSA Public Key...");
            String publicKey = client.getPublicKey();
            System.out.println("      [OK] Public key retrieved and cached.");

            // 2. Check availability
            System.out.println("\n[2/6] Checking availability for " + testEmail + "...");
            boolean isAvailable = client.checkAvailability("email", testEmail);
            System.out.println("      [OK] Email available: " + isAvailable);

            // 3. Register user with automatic client-side RSA encryption
            System.out.println("\n[3/6] Registering new user...");
            AuthResponse regResponse = client.register(
                testFullName,
                testEmail,
                testPhone,
                testPassword,
                testPassword
            );

            String userUuid = regResponse.getUser() != null ? regResponse.getUser().getUuid() : "N/A";
            String tokenSample = regResponse.getToken() != null && regResponse.getToken().length() > 25
                ? regResponse.getToken().substring(0, 25) + "..."
                : "N/A";

            System.out.println("      [OK] Registration successful!");
            System.out.println("      User UUID : " + userUuid);
            System.out.println("      Auth Token: " + tokenSample);

            // 4. Test conflict handling: attempt registering again
            System.out.println("\n[4/6] Testing multiple account conflict resolution...");
            try {
                client.register(testFullName, testEmail, testPhone, testPassword);
                System.out.println("      [FAIL] Duplicate registration was unexpectedly accepted.");
            } catch (TezzConflictException ex) {
                System.out.println("      [OK] Caught typed TezzConflictException!");
                System.out.println("      Conflict field : " + ex.getConflictField());
                System.out.println("      Server message : " + ex.getMessage());
                System.out.println("      -> Client can now offer: 'Sign In', 'Reset Password', or 'Change Email'.");
            } catch (TezzAuthException ex) {
                System.out.println("      [WARN] Caught general TezzAuthException: " + ex.getMessage());
            }

            // 5. Authenticate (Login)
            System.out.println("\n[5/6] Authenticating user credentials...");
            AuthResponse loginResponse = client.login(testEmail, testPassword);
            String sessionToken = loginResponse.getToken();

            System.out.println("      [OK] Login successful!");
            System.out.println("      User Name : " + (loginResponse.getUser() != null ? loginResponse.getUser().getFullName() : "N/A"));
            System.out.println("      Email     : " + (loginResponse.getUser() != null ? loginResponse.getUser().getEmail() : "N/A"));

            // 6. Fetch User Profile
            System.out.println("\n[6/6] Fetching verified profile with session token...");
            AuthResponse profileResponse = client.getProfile(sessionToken);
            System.out.println("      [OK] Profile retrieved successfully!");
            System.out.println("      UUID           : " + (profileResponse.getUser() != null ? profileResponse.getUser().getUuid() : "N/A"));
            System.out.println("      Email Verified : " + (profileResponse.getUser() != null ? profileResponse.getUser().isEmailVerified() : false));
            System.out.println("      Phone Verified : " + (profileResponse.getUser() != null ? profileResponse.getUser().isPhoneVerified() : false));

            System.out.println("\n======================================================");
            System.out.println("Java Standard Test Project: ALL FLOWS EXECUTED SUCCESSFULLY!");
            System.out.println("======================================================");
        } catch (Exception ex) {
            System.err.println("\n[ERROR] Example project execution failed: " + ex.getMessage());
            System.exit(1);
        }
    }
}
