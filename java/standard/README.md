# auth-sdk (Java Standard SDK)

Official Java 11+ SDK for Tezz Auth (`account.tezzcorp.com`).

- **End-to-End RSA-OAEP Encryption** via native Java JCA/JCE (`javax.crypto.Cipher`)
- **Multiple Account Conflict Resolution** (`TezzConflictException`) with typed conflict field
- **Built for Java 11+** - leverages modern native `java.net.http.HttpClient`
- **Anti-Enumeration & Per-User Rate Limit Protection**
- **Zero heavy dependencies** (only `org.json` for lightweight JSON serialization)

---

## Maven Dependency

```xml
<dependency>
    <groupId>com.tezzcorp</groupId>
    <artifactId>auth-sdk</artifactId>
    <version>1.0.0</version>
</dependency>
```

---

## Quick Start

```java
import com.tezzcorp.auth.TezzAuthClient;

TezzAuthClient client = new TezzAuthClient("http://localhost:3000"); // Production: https://account.tezzcorp.com
```

---

## Complete Usage Examples

### 1. Check Availability (Email or Phone)
```java
boolean isAvailable = client.checkAvailability("email", "rohit@example.com");
System.out.println("Available: " + isAvailable);
```

### 2. User Registration & Multiple Account Conflict Handling
When registering, if an account already exists with that email or phone, the SDK throws `TezzConflictException`:

```java
import com.tezzcorp.auth.TezzAuthClient;
import com.tezzcorp.auth.model.AuthResponse;
import com.tezzcorp.auth.exception.TezzConflictException;
import com.tezzcorp.auth.exception.TezzRateLimitException;
import com.tezzcorp.auth.exception.TezzValidationException;
import com.tezzcorp.auth.exception.TezzAuthException;

TezzAuthClient client = new TezzAuthClient("http://localhost:3000");

try {
    AuthResponse reg = client.register(
        "Rohit Sharma",
        "rohit@example.com",
        "+919876543210",
        "SecurePassword@123",
        "SecurePassword@123"
    );

    System.out.println("[OK] User UUID: " + reg.getUser().getUuid());
    System.out.println("[OK] JWT Token: " + reg.getToken());

} catch (TezzConflictException e) {
    System.out.println("[WARN] Account conflict detected on: " + e.getConflictField());
    System.out.println("   Message: " + e.getMessage());

    // Present actionable choices to the user:
    switch (e.getConflictField()) {
        case "email":
            System.out.println("  1. Sign in with rohit@example.com");
            System.out.println("  2. Reset password via email OTP");
            System.out.println("  3. Register with a different email address");
            break;
        case "phone":
            System.out.println("  1. Sign in with +919876543210");
            System.out.println("  2. Reset password via SMS OTP");
            System.out.println("  3. Register with a different phone number");
            break;
        case "both":
            System.out.println("  1. Sign in to existing account");
            System.out.println("  2. Recover password");
            break;
    }
} catch (TezzValidationException e) {
    System.err.println("Validation failed: " + e.getMessage());
} catch (TezzRateLimitException e) {
    System.err.println("Rate limited! Try again in " + e.getLockoutSeconds() + " seconds");
} catch (TezzAuthException e) {
    System.err.println("Auth failure: " + e.getMessage());
}
```

### 3. User Login
```java
AuthResponse login = client.login("rohit@example.com", "SecurePassword@123");
System.out.println("Welcome, " + login.getUser().getFullName());
System.out.println("Session Token: " + login.getToken());
```

### 4. Forgot Password & OTP Reset Flow
```java
// Step 1: Request OTP
AuthResponse forgot = client.forgotPassword("rohit@example.com", "email");
System.out.println(forgot.getMessage());

// Step 2: Verify OTP and update password
AuthResponse reset = client.resetPassword(
    "rohit@example.com",
    "email",
    "123456",
    "BrandNewPassword@456",
    "BrandNewPassword@456"
);
System.out.println(reset.getMessage()); // "Password has been reset successfully. You can now log in."
```

---

## Error Hierarchy

```
TezzAuthException (base)
 ├── TezzConflictException (statusCode: 409, conflictField: "email" | "phone" | "both")
 ├── TezzRateLimitException (statusCode: 429, remainingAttempts, lockoutSeconds)
 └── TezzValidationException (statusCode: 422)
```

---

## License
MIT (c) TezzCorp
