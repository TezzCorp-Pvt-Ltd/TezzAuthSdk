# @tezzcorp/auth-sdk

Official **Pure JavaScript** Client SDK for Tezz Auth (`account.tezzcorp.com`).

- **Zero external dependencies** - uses Node.js built-in `crypto` and standard native `fetch`
- **End-to-End RSA-OAEP Encryption** - passwords are encrypted on the client using the server's RSA public key before hitting the network
- **Dual Module Format** - supports both CommonJS (`require`) and ESM (`import`)
- **Built-in TypeScript Definitions** - full autocomplete out of the box without any compile step
- **Automatic In-Memory Public Key Caching** with rolling TTL
- **First-Class Multiple Account Conflict Handling** (`TezzConflictError`) with interactive UX branching

---

## Installation

```bash
npm install @tezzcorp/auth-sdk
```

---

## Quick Start

The SDK comes with `https://account.tezzcorp.com` pre-configured out of the box. You do not need to configure any URL.

### CommonJS
```javascript
const { TezzAuthClient } = require('@tezzcorp/auth-sdk');

// Automatically connects to https://account.tezzcorp.com
const client = new TezzAuthClient();
```

### ESM
```javascript
import { TezzAuthClient } from '@tezzcorp/auth-sdk';

const client = new TezzAuthClient();
```

> **Optional Custom Endpoint**:
> If you are self-hosting or testing locally, you can optionally override `baseUrl`:
> ```javascript
> const client = new TezzAuthClient({ baseUrl: 'https://auth.yourdomain.com' });
> ```
---

## Complete Usage Examples

### 1. Check Availability (Email or Phone)
```javascript
const check = await client.checkAvailability('email', 'user@example.com');
if (check.available) {
  console.log('[OK] Email is available for registration');
} else {
  console.log('[CONFLICT] Email already in use');
}
```

### 2. User Registration with Multiple Account Conflict Handling
When registering, if an account with that email or phone already exists, the SDK throws a typed `TezzConflictError` indicating the exact conflicting credential (`'email'`, `'phone'`, or `'both'`). Your application can present intuitive options:

```javascript
const { TezzConflictError, TezzValidationError } = require('@tezzcorp/auth-sdk');

try {
  const result = await client.register({
    fullName: 'Rohit Sharma',
    email: 'rohit@example.com',
    phoneNumber: '+919876543210',
    password: 'SecurePassword@123',
    confirmPassword: 'SecurePassword@123',
  });

  console.log('[OK] User registered:', result.user.uuid);
  console.log('[OK] JWT token:', result.token);
} catch (err) {
  if (err instanceof TezzConflictError) {
    console.warn(`[WARN] Account conflict on ${err.conflictField.toUpperCase()}: ${err.message}`);

    // Present intuitive options to the user:
    switch (err.conflictField) {
      case 'email':
        console.log('Choice 1: [Sign In with this Email]');
        console.log('Choice 2: [Reset Password via Email OTP]');
        console.log('Choice 3: [Use a Different Email Address]');
        break;
      case 'phone':
        console.log('Choice 1: [Sign In with this Phone Number]');
        console.log('Choice 2: [Reset Password via SMS OTP]');
        console.log('Choice 3: [Use a Different Phone Number]');
        break;
      case 'both':
        console.log('Choice 1: [Sign In to Existing Account]');
        console.log('Choice 2: [Recover Account Access]');
        break;
    }
  } else if (err instanceof TezzValidationError) {
    console.error('Validation errors:', err.errors);
  }
}
```

### 3. User Login
```javascript
const login = await client.login('rohit@example.com', 'SecurePassword@123');
console.log('Welcome back:', login.user.full_name);
console.log('Verified JWT:', login.token);
```

### 4. Forgot Password Flow
```javascript
// Step 1: Request OTP (email or SMS channel)
const forgotRes = await client.forgotPassword('rohit@example.com', 'email');
console.log(forgotRes.message);
// Uniform privacy-safe message:
// "If your account exists, you will receive password reset instructions with an OTP. Please also check your spam/junk folder for emails."

// Step 2: Verify OTP and update password
const resetRes = await client.resetPassword({
  identifier: 'rohit@example.com',
  channel: 'email',
  otpCode: '123456',
  newPassword: 'BrandNewPassword@456',
  confirmNewPassword: 'BrandNewPassword@456',
});

console.log(resetRes.message); // "Password has been reset successfully. You can now log in."
```

### 5. Local RS256 JWT Verification (Offline)
Services in your infrastructure can verify user tokens locally using the server's public key without hitting the auth database:

```javascript
const jwt = require('jsonwebtoken');

// 1. Get cached public key from SDK client
const publicKeyPem = await client.getPublicKey();

// 2. Verify token locally
try {
  const decoded = jwt.verify(userJwtToken, publicKeyPem, {
    algorithms: ['RS256'],
  });
  console.log('Authenticated User UUID:', decoded.sub);
  console.log('User Email:', decoded.email);
} catch (jwtErr) {
  console.error('Invalid or expired token:', jwtErr.message);
}
```

---

## Error Hierarchy

```
TezzAuthError (base)
 ├── TezzConflictError (statusCode: 409, conflictField: 'email' | 'phone' | 'both')
 ├── TezzRateLimitError (statusCode: 429, remainingAttempts, lockoutSeconds)
 └── TezzValidationError (statusCode: 422, errors: [{ msg, path }])
```

---

## License
MIT License - Copyright (c) 2026 TezzCorp Pvt. Ltd.
