package com.example.tezzauth;

import android.os.Bundle;
import android.widget.Button;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;

import com.tezz.auth.android.TezzAuthClient;
import com.tezz.auth.android.TezzCallback;
import com.tezz.auth.android.exception.TezzAuthException;
import com.tezz.auth.android.exception.TezzConflictException;
import com.tezz.auth.android.model.AuthResponse;

public class MainActivity extends AppCompatActivity {

    private TezzAuthClient authClient;
    private TextView tvStatus;
    private String currentSessionToken = null;

    private final String testEmail = "android.test." + System.currentTimeMillis() + "@tezzcorp.com";
    private final String testPhone = "+919876543210";
    private final String testPassword = "AndroidPassword#2026";
    private final String testFullName = "Android Test User";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // Pre-configured to https://account.tezzcorp.com (or pass custom endpoint)
        authClient = new TezzAuthClient("https://account.tezzcorp.com");

        tvStatus = findViewById(R.id.tvStatus);
        Button btnCheckAvailability = findViewById(R.id.btnCheckAvailability);
        Button btnRegister = findViewById(R.id.btnRegister);
        Button btnLogin = findViewById(R.id.btnLogin);
        Button btnGetProfile = findViewById(R.id.btnGetProfile);

        log("Initialized TezzAuthClient. Target: " + TezzAuthClient.DEFAULT_BASE_URL);

        btnCheckAvailability.setOnClickListener(v -> checkAvailability());
        btnRegister.setOnClickListener(v -> registerUser());
        btnLogin.setOnClickListener(v -> loginUser());
        btnGetProfile.setOnClickListener(v -> fetchProfile());
    }

    private void checkAvailability() {
        log("\nChecking availability for: " + testEmail);
        authClient.checkAvailability("email", testEmail, new TezzCallback<Boolean>() {
            @Override
            public void onSuccess(Boolean isAvailable) {
                log("[OK] Availability result: " + (isAvailable ? "Available" : "Taken"));
            }

            @Override
            public void onError(TezzAuthException error) {
                log("[ERROR] Availability check failed: " + error.getMessage());
            }
        });
    }

    private void registerUser() {
        log("\nRegistering user with automatic client-side RSA encryption...");
        authClient.register(
            testFullName,
            testEmail,
            testPhone,
            testPassword,
            testPassword,
            new TezzCallback<AuthResponse>() {
                @Override
                public void onSuccess(AuthResponse response) {
                    currentSessionToken = response.getToken();
                    String userUuid = response.getUser() != null ? response.getUser().getUuid() : "N/A";
                    log("[OK] Registration succeeded!");
                    log("User UUID: " + userUuid);
                    log("Token: " + (currentSessionToken != null ? currentSessionToken.substring(0, 20) + "..." : "None"));
                }

                @Override
                public void onError(TezzAuthException error) {
                    if (error instanceof TezzConflictException) {
                        TezzConflictException conflict = (TezzConflictException) error;
                        log("[CONFLICT] Account already exists for field: " + conflict.getConflictField());
                    } else {
                        log("[ERROR] Registration failed: " + error.getMessage());
                    }
                }
            }
        );
    }

    private void loginUser() {
        log("\nLogging in user with RSA encrypted password...");
        authClient.login(testEmail, testPassword, new TezzCallback<AuthResponse>() {
            @Override
            public void onSuccess(AuthResponse response) {
                currentSessionToken = response.getToken();
                log("[OK] Login successful!");
                log("Message: " + response.getMessage());
                log("User: " + (response.getUser() != null ? response.getUser().getFullName() : "N/A"));
            }

            @Override
            public void onError(TezzAuthException error) {
                log("[ERROR] Login failed: " + error.getMessage());
            }
        });
    }

    private void fetchProfile() {
        if (currentSessionToken == null) {
            log("\n[WARN] Please register or login first to obtain a session token.");
            return;
        }

        log("\nFetching verified profile using session token...");
        authClient.getProfile(currentSessionToken, new TezzCallback<AuthResponse>() {
            @Override
            public void onSuccess(AuthResponse response) {
                log("[OK] Profile retrieved successfully!");
                if (response.getUser() != null) {
                    log("UUID: " + response.getUser().getUuid());
                    log("Email: " + response.getUser().getEmail());
                    log("Email Verified: " + response.getUser().isEmailVerified());
                    log("Phone Verified: " + response.getUser().isPhoneVerified());
                }
            }

            @Override
            public void onError(TezzAuthException error) {
                log("[ERROR] Profile fetch failed: " + error.getMessage());
            }
        });
    }

    private void log(String message) {
        runOnUiThread(() -> {
            String current = tvStatus.getText().toString();
            tvStatus.setText(current + "\n" + message);
        });
    }
}
