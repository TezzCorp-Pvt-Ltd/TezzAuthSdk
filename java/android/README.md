# auth-sdk (Android SDK)

Official Android Client Library for Tezz Auth (`account.tezzcorp.com`).

- **End-to-End RSA-OAEP Encryption** on Android background thread
- **UI Thread Safe**: Callbacks automatically post to `Looper.getMainLooper()` for safe UI updates
- **Multiple Account Conflict Handling** (`TezzConflictException`) with actionable user prompts
- **Encrypted Storage Compatible**: Works seamlessly with AndroidX `EncryptedSharedPreferences`
- **Asynchronous Non-blocking Operations** powered by OkHttp and thread pooling

---

## Requirements

- Android API Level 21+ (Android 5.0 Lollipop or higher)
- OkHttp 4.12.0
- Gson 2.10.1

---

## Gradle Setup

In your app module `build.gradle`:
```groovy
dependencies {
    implementation 'com.tezz:auth-sdk-android:1.0.0'
    implementation 'com.squareup.okhttp3:okhttp:4.12.0'
    implementation 'com.google.code.gson:gson:2.10.1'
    implementation 'androidx.security:security-crypto:1.1.0-alpha06' // Recommended for EncryptedSharedPreferences
}
```

Ensure Internet permission is granted in `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.INTERNET" />
```

---

## Quick Start

```java
import com.tezz.auth.android.TezzAuthClient;

// Use 10.0.2.2 for Android Emulator connecting to host localhost:3000
// Production: https://account.tezzcorp.com
TezzAuthClient client = new TezzAuthClient("http://10.0.2.2:3000");
```

---

## Complete Usage Examples

### 1. User Registration & Multiple Account Conflict Resolution
When an account already exists with the entered email or phone, `onError` is triggered with `TezzConflictException`:

```java
import com.tezz.auth.android.TezzCallback;
import com.tezz.auth.android.model.AuthResponse;
import com.tezz.auth.android.exception.TezzAuthException;
import com.tezz.auth.android.exception.TezzConflictException;
import com.tezz.auth.android.exception.TezzRateLimitException;
import android.app.AlertDialog;

client.register(
    "Rohit Sharma",
    "rohit@example.com",
    "+919876543210",
    "SecurePassword@123",
    new TezzCallback<AuthResponse>() {
        @Override
        public void onSuccess(AuthResponse response) {
            String token = response.getToken();
            saveSecureToken(context, token); // Save encrypted
            Toast.makeText(context, "Account created successfully!", Toast.LENGTH_SHORT).show();
        }

        @Override
        public void onError(TezzAuthException error) {
            if (error instanceof TezzConflictException) {
                TezzConflictException conflict = (TezzConflictException) error;
                String field = conflict.getConflictField(); // "email", "phone", or "both"

                // Show an AlertDialog prompting the user:
                new AlertDialog.Builder(context)
                    .setTitle("Account Already Exists")
                    .setMessage("An account with this " + field + " is already registered.")
                    .setPositiveButton("Sign In Instead", (d, w) -> {
                        // Navigate to LoginActivity with pre-filled identifier
                        startActivity(new Intent(context, LoginActivity.class)
                            .putExtra("identifier", "rohit@example.com"));
                    })
                    .setNegativeButton("Reset Password", (d, w) -> {
                        // Navigate to ForgotPasswordActivity
                        startActivity(new Intent(context, ForgotPasswordActivity.class)
                            .putExtra("identifier", "rohit@example.com"));
                    })
                    .setNeutralButton("Cancel", null)
                    .show();

            } else if (error instanceof TezzRateLimitException) {
                TezzRateLimitException rate = (TezzRateLimitException) error;
                Toast.makeText(context, "Locked out for " + rate.getLockoutSeconds() + "s", Toast.LENGTH_LONG).show();
            } else {
                Toast.makeText(context, "Error: " + error.getMessage(), Toast.LENGTH_LONG).show();
            }
        }
    }
);
```

### 2. User Login
```java
client.login("rohit@example.com", "SecurePassword@123", new TezzCallback<AuthResponse>() {
    @Override
    public void onSuccess(AuthResponse response) {
        saveSecureToken(context, response.getToken());
        Toast.makeText(context, "Welcome, " + response.getUser().getFullName(), Toast.LENGTH_SHORT).show();
    }

    @Override
    public void onError(TezzAuthException error) {
        Toast.makeText(context, error.getMessage(), Toast.LENGTH_LONG).show();
    }
});
```

### 3. Forgot Password & OTP Reset Flow
```java
// Step 1: Request OTP
client.forgotPassword("rohit@example.com", "email", new TezzCallback<AuthResponse>() {
    @Override
    public void onSuccess(AuthResponse response) {
        Toast.makeText(context, response.getMessage(), Toast.LENGTH_LONG).show();
    }

    @Override
    public void onError(TezzAuthException error) {
        Toast.makeText(context, error.getMessage(), Toast.LENGTH_LONG).show();
    }
});

// Step 2: Verify OTP & update password
client.resetPassword(
    "rohit@example.com",
    "email",
    "123456",
    "NewSecurePassword@456",
    "NewSecurePassword@456",
    new TezzCallback<AuthResponse>() {
        @Override
        public void onSuccess(AuthResponse response) {
            Toast.makeText(context, "Password updated! You can now log in.", Toast.LENGTH_LONG).show();
        }

        @Override
        public void onError(TezzAuthException error) {
            Toast.makeText(context, error.getMessage(), Toast.LENGTH_LONG).show();
        }
    }
);
```

### 4. Client Storage Security on Android (Best Practice)
Never store raw JWT tokens in plain `SharedPreferences`. Use AndroidX `EncryptedSharedPreferences`:

```java
import androidx.security.crypto.EncryptedSharedPreferences;
import androidx.security.crypto.MasterKeys;
import android.content.SharedPreferences;
import android.content.Context;

public void saveSecureToken(Context context, String token) {
    try {
        String masterKeyAlias = MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC);
        SharedPreferences securePrefs = EncryptedSharedPreferences.create(
            "tezz_secure_prefs",
            masterKeyAlias,
            context,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        );

        securePrefs.edit().putString("tezz_jwt_token", token).apply();
    } catch (Exception e) {
        e.printStackTrace();
    }
}
```

---

## Error Hierarchy

```
TezzAuthException (base)
 ├── TezzConflictException (statusCode: 409, conflictField: "email" | "phone" | "both")
 └── TezzRateLimitException (statusCode: 429, remainingAttempts, lockoutSeconds)
```

---

## License
MIT (c) Tezz
