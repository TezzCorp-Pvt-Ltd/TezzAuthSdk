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

## Directory Structure

| Folder | Platform | Language / Framework | Build System |
| :--- | :--- | :--- | :--- |
| [npm/](file:///c:/GitHub/rohit/account/sdk/examples/npm/) | Node.js / Web | JavaScript (ESM & CJS) | NPM |
| [python/](file:///c:/GitHub/rohit/account/sdk/examples/python/) | Python | Python 3.9+ | Pip / PyPI |
| [dotnet/](file:///c:/GitHub/rohit/account/sdk/examples/dotnet/) | .NET | C# (.NET 8 / 10) | .NET CLI / NuGet |
| [java-standard/](file:///c:/GitHub/rohit/account/sdk/examples/java-standard/) | Java Backend | Java 11+ | Maven |
| [android/](file:///c:/GitHub/rohit/account/sdk/examples/android/) | Android App | Java / Android SDK | Gradle |
| [php/](file:///c:/GitHub/rohit/account/sdk/examples/php/) | PHP Backend | PHP 8.1+ | Composer |

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
