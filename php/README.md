# tezz/auth-sdk (PHP Composer SDK)

Official PHP Client SDK for Tezz Auth (`account.tezzcorp.com`).

- **End-to-End RSA-OAEP Encryption** via native PHP OpenSSL extension
- **Multiple Account Conflict Resolution** (`TezzConflictException`) with typed conflict field
- **Zero External Package Dependencies** - uses native PHP `curl`, `openssl`, and `json`
- **Anti-Enumeration & Per-User Rate Limit Protection**
- **Strictly Typed PHP 8.1+ DTOs** (`TezzUser`, `Response`)

---

## Requirements

- PHP 8.1 or higher
- `ext-openssl`
- `ext-curl`
- `ext-json`

---

## Installation

```bash
composer require tezz/auth-sdk
```

---

## Quick Start

The SDK comes with `https://account.tezzcorp.com` pre-configured out of the box. You do not need to configure any URL.

```php
use Tezz\Auth\TezzAuthClient;

// Automatically connects to https://account.tezzcorp.com
$client = new TezzAuthClient();
```

> **Optional Custom Endpoint**:
> If you are self-hosting or testing locally, you can optionally override `base_url`:
> ```php
> $client = new TezzAuthClient([
>     'base_url' => 'https://auth.yourdomain.com',
> ]);
> ```

---

## Complete Usage Examples

### 1. Check Availability (Email or Phone)
```php
$isAvailable = $client->checkAvailability('email', 'rohit@example.com');
echo $isAvailable ? "Email is available\n" : "Email is taken\n";
```

### 2. User Registration & Multiple Account Conflict Handling
When registering, if an account with that email or phone already exists, the SDK throws `TezzConflictException`. You can inspect `getConflictField()` to prompt the user:

```php
use Tezz\Auth\Exceptions\TezzConflictException;
use Tezz\Auth\Exceptions\TezzValidationException;
use Tezz\Auth\Exceptions\TezzRateLimitException;

try {
    $response = $client->register(
        fullName: 'Rohit Sharma',
        email: 'rohit@example.com',
        phoneNumber: '+919876543210',
        password: 'SecurePassword@123',
        confirmPassword: 'SecurePassword@123'
    );

    echo "[OK] Registered successfully! UUID: " . $response->user->uuid . PHP_EOL;
    echo "[OK] JWT Token: " . $response->token . PHP_EOL;

} catch (TezzConflictException $e) {
    echo "[WARN] Conflict on: " . $e->getConflictField() . " - " . $e->getMessage() . PHP_EOL;

    // Present user choices:
    switch ($e->getConflictField()) {
        case 'email':
            echo "1. Sign in with rohit@example.com\n";
            echo "2. Reset password via email OTP\n";
            echo "3. Use a different email address\n";
            break;
        case 'phone':
            echo "1. Sign in with +919876543210\n";
            echo "2. Reset password via SMS OTP\n";
            echo "3. Use a different phone number\n";
            break;
        case 'both':
            echo "1. Sign in to existing account\n";
            echo "2. Recover account access\n";
            break;
    }
} catch (TezzValidationException $e) {
    echo "Validation failed: " . print_r($e->getErrors(), true);
} catch (TezzRateLimitException $e) {
    echo "Rate limited: retry after " . $e->getLockoutSeconds() . " seconds\n";
}
```

### 3. User Login
```php
$login = $client->login('rohit@example.com', 'SecurePassword@123');
echo "Welcome back, " . $login->user->fullName . PHP_EOL;
echo "Session Token: " . $login->token . PHP_EOL;
```

### 4. Forgot Password & OTP Reset Flow
```php
// Step 1: Request OTP
$forgot = $client->forgotPassword('rohit@example.com', 'email');
echo $forgot->message . PHP_EOL;

// Step 2: Verify OTP and reset password
$reset = $client->resetPassword(
    identifier: 'rohit@example.com',
    channel: 'email',
    otpCode: '123456',
    newPassword: 'BrandNewPassword@456',
    confirmNewPassword: 'BrandNewPassword@456'
);
echo $reset->message . PHP_EOL;
```

### 5. Local RS256 JWT Verification (Offline)
Using `firebase/php-jwt`:

```php
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

$publicKeyPem = $client->getPublicKey();

try {
    $decoded = JWT::decode($userJwtToken, new Key($publicKeyPem, 'RS256'));
    echo "Authenticated User UUID: " . $decoded->sub . PHP_EOL;
    echo "User Email: " . $decoded->email . PHP_EOL;
} catch (\Exception $e) {
    echo "Invalid JWT: " . $e->getMessage() . PHP_EOL;
}
```

---

## Error Hierarchy

```
TezzAuthException (base)
 ├── TezzConflictException (statusCode: 409, conflictField: 'email' | 'phone' | 'both')
 ├── TezzRateLimitException (statusCode: 429, remainingAttempts, lockoutSeconds)
 └── TezzValidationException (statusCode: 422, errors: array)
```

---

## License
MIT (c) Tezz
