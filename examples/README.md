# Tezz Auth SDK - Example & Test Projects

This directory contains standalone, production-ready test projects demonstrating the official Tezz Auth client libraries across all supported programming languages and application platforms.

Every example showcases end-to-end integration:
- Initializing the client with the default production endpoint (`https://account.tezzcorp.com`) or custom endpoint (`http://localhost:3000`)
- Checking username/email/phone availability
- Client-side RSA-OAEP password encryption
- User registration and authentication
- Profile retrieval (`getProfile` / `me`)
- Multiple-account conflict handling (`TezzConflictError` / `TezzConflictException`)
- Password recovery and deletion management

---

## Directory Structure & Published Registries

All test projects strictly install and resolve from their official published registry endpoints:

| Folder | Platform | Language / Framework | Official Registry | Package Identifier | Published Version |
| :--- | :--- | :--- | :--- | :--- | :--- |
| [npm/](file:///c:/GitHub/rohit/account/sdk/examples/npm/) | Node.js / Web | JavaScript (ESM & CJS) | npmjs.org | `@tezzcorp/auth-sdk` | `2.0.0` |
| [python/](file:///c:/GitHub/rohit/account/sdk/examples/python/) | Python | Python 3.9+ | pypi.org | `tezz-auth` | `2.0.0` |
| [dotnet/](file:///c:/GitHub/rohit/account/sdk/examples/dotnet/) | .NET | C# (.NET 10 / 8) | nuget.org | `Tezz.Auth` | `2.0.0` |
| [php/](file:///c:/GitHub/rohit/account/sdk/examples/php/) | PHP Backend | PHP 8.1+ | packagist.org | `tezz/auth-sdk` | `v2.0.0` |
| [java-standard/](file:///c:/GitHub/rohit/account/sdk/examples/java-standard/) | Java Backend | Java 11+ | GitHub Packages | `com.tezz:auth-sdk` | `2.0.0` |
| [android/](file:///c:/GitHub/rohit/account/sdk/examples/android/) | Android App | Java / Android SDK | GitHub Packages | `com.tezz.auth.android:auth-sdk-android` | `2.0.0` |

---

## Environment Configuration

All test projects support pointing to either the central production service or a local instance:

- **Production (Default)**: `https://account.tezzcorp.com`
- **Local Development**: `http://localhost:3000`

Set the `TEZZ_AUTH_URL` environment variable to override the target host across any example:

```bash
# Windows PowerShell
$env:TEZZ_AUTH_URL="http://localhost:3000"

# Linux / macOS
export TEZZ_AUTH_URL="http://localhost:3000"
```
