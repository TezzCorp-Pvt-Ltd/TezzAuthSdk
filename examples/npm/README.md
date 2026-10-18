# Tezz Auth - Node.js Example Project

This is a standalone test project demonstrating how to integrate and use the `@tezzcorp/auth-sdk` package in a Node.js or backend JavaScript application.

---

## Installation

```bash
cd sdk/examples/npm
npm install
```

To install from public NPM instead of the local source:

```bash
npm install @tezzcorp/auth-sdk@latest
```

---

## Running the Example
 
 Run against production (`https://account.tezzcorp.com`):
 ```bash
 npm start
 ```
 
 To point to a custom endpoint, specify `TEZZ_AUTH_URL`:
 ```bash
 # Windows PowerShell
 $env:TEZZ_AUTH_URL="https://staging.account.tezzcorp.com"; npm start
 
 # Linux / macOS
 TEZZ_AUTH_URL="https://staging.account.tezzcorp.com" npm start
 ```

---

## What This Example Demonstrates
1. Client initialization and RSA public key caching
2. Real-time availability check for email and phone numbers
3. Client-side RSA-OAEP password encryption during registration
4. Multiple account conflict handling (`TezzConflictError`)
5. Secure login with encrypted credentials
6. Fetching verified profile data (`client.getProfile(token)`)
