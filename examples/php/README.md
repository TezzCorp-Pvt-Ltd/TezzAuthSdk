# Tezz Auth - PHP Example Project

This is a standalone test project demonstrating how to integrate and use the `tezz/auth-sdk` Composer package in modern PHP applications (Laravel, Symfony, WordPress, or custom backends).

---

## Installation

```bash
cd sdk/examples/php
composer install
```

---

## Running the Example
 
 Run against production (`https://account.tezzcorp.com`):
 ```bash
 php example.php
 ```
 
 To point to a custom endpoint, specify `TEZZ_AUTH_URL`:
 ```bash
 # Windows PowerShell
 $env:TEZZ_AUTH_URL="https://staging.account.tezzcorp.com"; php example.php
 
 # Linux / macOS
 TEZZ_AUTH_URL="https://staging.account.tezzcorp.com" php example.php
 ```

---

## What This Example Demonstrates
1. Native PHP 8.1+ client initialization with configurable timeout
2. Checking credential availability via `checkAvailability($type, $value)`
3. Client-side RSA-OAEP password encryption via OpenSSL
4. Multiple account conflict handling (`TezzConflictException`)
5. Authenticating user via `login($identifier, $password)`
6. Fetching verified profile with JWT session token via `getProfile($token)`
