# Tezz Auth - Python Example Project

This is a standalone test project demonstrating how to integrate and use the `tezz-auth` client package in Python applications (Django, FastAPI, Flask, or backend services).

---

## Installation

```bash
cd sdk/examples/python

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux / macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

To install the released package directly from PyPI:

```bash
pip install tezz-auth>=1.0.0
```

---

## Running the Example
 
 Run against production (`https://account.tezzcorp.com`):
 ```bash
 python main.py
 ```
 
 To point to a custom endpoint, specify `TEZZ_AUTH_URL`:
 ```bash
 # Windows PowerShell
 $env:TEZZ_AUTH_URL="https://staging.account.tezzcorp.com"; python main.py
 
 # Linux / macOS
 TEZZ_AUTH_URL="https://staging.account.tezzcorp.com" python main.py
 ```

---

## What This Example Demonstrates
1. Context manager usage with `with TezzAuthClient(...) as client:`
2. RSA public key retrieval and automatic in-memory caching
3. Real-time availability check for credentials
4. Client-side RSA-OAEP password encryption
5. Typed conflict handling with `TezzConflictError`
6. Profile retrieval with JWT session token (`client.get_profile(token)`)
