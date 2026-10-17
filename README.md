# Tezz Auth Multi-Platform SDK Suite

Official client libraries for the Tezz Auth central identity and authentication system (`account.tezzcorp.com`).

---

## Overview

The Tezz Auth SDK Suite provides native, idiomatic client libraries for web, backend, and mobile applications. Every SDK incorporates end-to-end RSA-OAEP cryptography, in-memory public key caching, structured multiple-account conflict handling, and offline RS256 JWT validation.

### Supported Platforms

| Platform | Package | Directory | Requirements |
|---|---|---|---|
| **JavaScript / TypeScript** | `@tezz/auth-sdk` | `npm/` | Node.js 18+ (Pure JS, zero external dependencies) |
| **Python** | `tezz-auth` | `python/` | Python 3.9+ (`requests`, `cryptography`) |
| **PHP** | `tezz/auth-sdk` | `php/` | PHP 8.1+ (`ext-curl`, `ext-openssl`, `ext-json`) |
| **.NET (C#)** | `Tezz.Auth` | `dotnet/` | .NET 8.0 LTS / .NET 10.0 (Pure C#, zero external dependencies) |
| **Java Standard** | `com.tezz:auth-sdk` | `java/standard/` | Java 11+ (`java.net.http`, `org.json`) |
| **Android** | `com.tezz:auth-sdk-android` | `java/android/` | Android API Level 21+ (OkHttp, Gson) |

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

All SDKs come pre-configured to connect directly to the central authentication service at `https://account.tezzcorp.com`. Developers do not need to configure any URL to get started.

### 1. JavaScript / TypeScript (`@tezz/auth-sdk`)

```bash
npm install @tezz/auth-sdk
```

```javascript
const { TezzAuthClient, TezzConflictError } = require('@tezz/auth-sdk');

// Pre-configured to https://account.tezzcorp.com
const client = new TezzAuthClient();

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

### 2. Python (`tezz-auth`)

```bash
pip install tezz-auth
```

```python
from tezz_auth import TezzAuthClient, TezzConflictError

# Pre-configured to https://account.tezzcorp.com
client = TezzAuthClient()

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

### 3. PHP Composer (`tezz/auth-sdk`)

```bash
composer require tezz/auth-sdk
```

```php
use Tezz\Auth\TezzAuthClient;
use Tezz\Auth\Exceptions\TezzConflictException;

// Pre-configured to https://account.tezzcorp.com
$client = new TezzAuthClient();

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

### 4. .NET (C#) (`Tezz.Auth`)

```bash
dotnet add package Tezz.Auth
```

```csharp
using Tezz.Auth;
using Tezz.Auth.Exceptions;

// Pre-configured to https://account.tezzcorp.com
using var client = new TezzAuthClient();

try
{
    var response = await client.RegisterAsync(
        fullName: "Rohit Sharma",
        email: "rohit@example.com",
        phoneNumber: "+919876543210",
        password: "SecurePassword@123");

    Console.WriteLine($"Session Token: {response.Token}");
}
catch (TezzConflictException ex)
{
    Console.WriteLine($"Conflict field: {ex.ConflictField}");
}
```

### 5. Java 11+ Standard

```java
import com.tezz.auth.TezzAuthClient;
import com.tezz.auth.model.AuthResponse;
import com.tezz.auth.exception.TezzConflictException;

// Pre-configured to https://account.tezzcorp.com
TezzAuthClient client = new TezzAuthClient();

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

### 6. Android (API 21+)

```java
import com.tezz.auth.android.TezzAuthClient;
import com.tezz.auth.android.TezzCallback;
import com.tezz.auth.android.model.AuthResponse;
import com.tezz.auth.android.exception.TezzAuthException;
import com.tezz.auth.android.exception.TezzConflictException;

// Pre-configured to https://account.tezzcorp.com
TezzAuthClient client = new TezzAuthClient();

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
├── dotnet/          # .NET C# NuGet package
├── npm/             # JavaScript / TypeScript NPM package
├── python/          # Python PyPI package
├── php/             # PHP Composer package
└── java/
    ├── standard/    # Java 11+ Maven package
    └── android/     # Android AAR library
```

---

## License

MIT (c) Tezz
