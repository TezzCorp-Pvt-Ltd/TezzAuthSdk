# Tezz Auth - .NET (C#) Example Project

This is a standalone test project demonstrating how to integrate and use the `Tezz.Auth` NuGet package in .NET 8.0 or .NET 10.0 applications (ASP.NET Core, Console, MAUI, Worker Services).

---

## Installation & Build

```bash
cd sdk/examples/dotnet
dotnet build
```

To use the released NuGet package instead of the local project reference:

```bash
dotnet add package Tezz.Auth --version 1.1.0
```

---

## Running the Example
 
 Run the application against production (`https://account.tezzcorp.com`):
 ```bash
 dotnet run
 ```
 
 To point to a custom endpoint, specify `TEZZ_AUTH_URL`:
 ```bash
 # Windows PowerShell
 $env:TEZZ_AUTH_URL="https://staging.account.tezzcorp.com"; dotnet run
 
 # Linux / macOS
 TEZZ_AUTH_URL="https://staging.account.tezzcorp.com" dotnet run
 ```

---

## What This Example Demonstrates
1. Creating and configuring `TezzAuthClient` with `IDisposable`
2. Fetching and rolling-caching RSA public key
3. Checking credential availability via `CheckAvailabilityAsync`
4. Client-side RSA-OAEP password encryption
5. Handling `TezzConflictException` with typed `ConflictField`
6. Authenticating user via `LoginAsync`
7. Fetching verified profile with JWT session token via `GetProfileAsync`
