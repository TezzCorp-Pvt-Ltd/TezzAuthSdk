# Tezz Auth Multi-Platform SDK Suite

Official client libraries for the Tezz Auth central identity and authentication system (`account.tezzcorp.com`).

---

## Overview

The Tezz Auth SDK Suite provides native, idiomatic client libraries for web, backend, and mobile applications. Every SDK incorporates end-to-end RSA-OAEP cryptography, in-memory public key caching, structured multiple-account conflict handling, and offline RS256 JWT validation.

### Supported Platforms

| Platform | Package | Directory | Requirements |
|---|---|---|---|
| **JavaScript / TypeScript** | `@tezzcorp/auth-sdk` | `npm/` | Node.js 18+ (Pure JS, zero external dependencies) |
| **Python** | `tezzcorp-auth` | `python/` | Python 3.9+ (`requests`, `cryptography`) |
| **PHP** | `tezzcorp/auth-sdk` | `php/` | PHP 8.1+ (`ext-curl`, `ext-openssl`, `ext-json`) |
| **Java Standard** | `com.tezzcorp:auth-sdk` | `java/standard/` | Java 11+ (`java.net.http`, `org.json`) |
| **Android** | `com.tezzcorp:auth-sdk-android` | `java/android/` | Android API Level 21+ (OkHttp, Gson) |

---

## Core Capabilities Across All SDKs

1. **End-to-End Cryptography**:
   Passwords and credentials are encrypted on the client device using RSA-OAEP SHA-256 before transmission over the network. The public key is retrieved from `GET /api/v1/auth/public-key` and cached with rolling TTL.

2. **Multiple Account Conflict Resolution**:
   When registration encounters existing credentials, the SDK raises a typed `TezzConflictError` or `TezzConflictException` with the specific conflicting attribute (`'email'`, `'phone'`, or `'both'`). This allows client applications to present clear choices (Sign In vs Reset Password vs Change Input).

3. **Offline RS256 JWT Verification**:
   Downstream microservices can verify user session tokens locally using the cached RSA public key without making network requests to the auth database.

4. **Uniform Anti-Enumeration & Security**:
   All SDKs adhere to privacy-safe messaging for password recovery and account lookups.

---

## Quick Starts

### 1. JavaScript / TypeScript (`@tezzcorp/auth-sdk`)

```bash
npm install @tezzcorp/auth-sdk
```

```javascript
const { TezzAuthClient, TezzConflictError } = require('@tezzcorp/auth-sdk');

const client = new TezzAuthClient({
  baseUrl: 'http://localhost:3000', // Production: https://account.tezzcorp.com
});

try {
  const result = await client.register({
    fullName: 'Rohit Sharma',
    email: 'rohit@example.com',
    phoneNumber: '+919876543210',
    password: 'SecurePassword@123',
  });
  console.log('Session Token:', result.token);
} catch (err) {
  if (err instanceof TezzConflictError) {
    console.log('Conflict on field:', err.conflictField); // 'email' | 'phone' | 'both'
  }
}
```

### 2. Python (`tezzcorp-auth`)

```bash
pip install tezzcorp-auth
```

```python
from tezzcorp_auth import TezzAuthClient, TezzConflictError

client = TezzAuthClient(base_url="http://localhost:3000")

try:
    result = client.register(
        full_name="Rohit Sharma",
        email="rohit@example.com",
        phone_number="+919876543210",
        password="SecurePassword@123",
    )
    print("Session Token:", result.token)
except TezzConflictError as e:
    print(f"Account exists. Conflicting field: {e.conflict_field}")
```

### 3. PHP Composer (`tezzcorp/auth-sdk`)

```bash
composer require tezzcorp/auth-sdk
```

```php
use TezzCorp\Auth\TezzAuthClient;
use TezzCorp\Auth\Exceptions\TezzConflictException;

$client = new TezzAuthClient(['base_url' => 'http://localhost:3000']);

try {
    $result = $client->register(
        fullName: 'Rohit Sharma',
        email: 'rohit@example.com',
        phoneNumber: '+919876543210',
        password: 'SecurePassword@123'
    );
    echo "Session Token: " . $result->token . PHP_EOL;
} catch (TezzConflictException $e) {
    echo "Conflict field: " . $e->getConflictField() . PHP_EOL;
}
```

### 4. Java 11+ Standard

```java
import com.tezzcorp.auth.TezzAuthClient;
import com.tezzcorp.auth.model.AuthResponse;
import com.tezzcorp.auth.exception.TezzConflictException;

TezzAuthClient client = new TezzAuthClient("http://localhost:3000");

try {
    AuthResponse response = client.register(
        "Rohit Sharma",
        "rohit@example.com",
        "+919876543210",
        "SecurePassword@123",
        "SecurePassword@123"
    );
    System.out.println("Session Token: " + response.getToken());
} catch (TezzConflictException e) {
    System.out.println("Conflict field: " + e.getConflictField());
}
```

### 5. Android (API 21+)

```java
import com.tezzcorp.auth.android.TezzAuthClient;
import com.tezzcorp.auth.android.TezzCallback;
import com.tezzcorp.auth.android.model.AuthResponse;
import com.tezzcorp.auth.android.exception.TezzAuthException;
import com.tezzcorp.auth.android.exception.TezzConflictException;

TezzAuthClient client = new TezzAuthClient("http://10.0.2.2:3000");

client.register(
    "Rohit Sharma",
    "rohit@example.com",
    "+919876543210",
    "SecurePassword@123",
    new TezzCallback<AuthResponse>() {
        @Override
        public void onSuccess(AuthResponse res) {
            // Main thread callback
            String token = res.getToken();
        }

        @Override
        public void onError(TezzAuthException err) {
            if (err instanceof TezzConflictException) {
                TezzConflictException conflict = (TezzConflictException) err;
                String field = conflict.getConflictField();
                // Prompt user to sign in or reset password
            }
        }
    }
);
```

---

## Repository Structure

```
sdk/
├── npm/             # JavaScript / TypeScript NPM package
├── python/          # Python PyPI package
├── php/             # PHP Composer package
└── java/
    ├── standard/    # Java 11+ Maven package
    └── android/     # Android AAR library
```

---

## License

MIT (c) TezzCorp
