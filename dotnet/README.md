# Tezz.Auth (.NET SDK)

Official .NET Client SDK for Tezz Auth (`account.tezzcorp.com`).

- **End-to-End RSA-OAEP Encryption** using native `System.Security.Cryptography.RSA` (SHA-256 padding)
- **Multiple Account Conflict Resolution** (`TezzConflictException`) with typed conflict field
- **Zero Third-Party Dependencies** - built entirely on modern standard .NET libraries (`System.Net.Http`, `System.Text.Json`, `System.Security.Cryptography`)
- **Multi-Target Framework Support** - targets .NET 8.0 LTS and .NET 10.0
- **Thread-Safe & Async/Await First** - designed for high-concurrency ASP.NET Core services
- **Automated Public Key Caching** with rolling in-memory TTL

---

## Installation

```bash
dotnet add package Tezz.Auth
```

Or via Package Manager Console:
```powershell
Install-Package Tezz.Auth
```

---

## Quick Start

### 1. Direct Instantiation

```csharp
using Tezz.Auth;

using var client = new TezzAuthClient("http://localhost:3000"); // Production: https://account.tezzcorp.com
```

### 2. ASP.NET Core Dependency Injection

In `Program.cs`:
```csharp
builder.Services.AddSingleton<TezzAuthClient>(sp =>
    new TezzAuthClient(builder.Configuration["TezzAuth:BaseUrl"] ?? "https://account.tezzcorp.com"));
```

---

## Complete Usage Examples

### 1. Check Availability (Email or Phone)

```csharp
bool isAvailable = await client.CheckAvailabilityAsync("email", "user@example.com");
Console.WriteLine(isAvailable ? "Email is available" : "Email is taken");
```

### 2. User Registration & Multiple Account Conflict Handling

When an account with the provided email or phone already exists, the SDK throws a typed `TezzConflictException`. You can inspect `ConflictField` (`"email"`, `"phone"`, or `"both"`) to guide the user:

```csharp
using Tezz.Auth;
using Tezz.Auth.Exceptions;

try
{
    var response = await client.RegisterAsync(
        fullName: "Rohit Sharma",
        email: "rohit@example.com",
        phoneNumber: "+919876543210",
        password: "SecurePassword@123");

    Console.WriteLine($"[OK] User registered! UUID: {response.User?.Uuid}");
    Console.WriteLine($"[OK] JWT Session Token: {response.Token}");
}
catch (TezzConflictException ex)
{
    Console.WriteLine($"[WARN] Account conflict detected on: {ex.ConflictField}");

    switch (ex.ConflictField)
    {
        case "email":
            Console.WriteLine("1. Sign in with rohit@example.com");
            Console.WriteLine("2. Reset password via email OTP");
            Console.WriteLine("3. Register with a different email");
            break;
        case "phone":
            Console.WriteLine("1. Sign in with +919876543210");
            Console.WriteLine("2. Reset password via SMS OTP");
            Console.WriteLine("3. Register with a different phone number");
            break;
        case "both":
            Console.WriteLine("1. Sign in to existing account");
            Console.WriteLine("2. Recover password");
            break;
    }
}
catch (TezzRateLimitException ex)
{
    Console.WriteLine($"Rate limited. Retry after {ex.LockoutSeconds} seconds.");
}
catch (TezzAuthException ex)
{
    Console.WriteLine($"Authentication error: {ex.Message} (HTTP {ex.StatusCode})");
}
```

### 3. User Login

```csharp
var login = await client.LoginAsync("rohit@example.com", "SecurePassword@123");
Console.WriteLine($"Welcome back, {login.User?.FullName}!");
Console.WriteLine($"Session Token: {login.Token}");
```

### 4. Forgot Password & OTP Reset Flow

```csharp
// Step 1: Request OTP
var forgot = await client.ForgotPasswordAsync("rohit@example.com", "email");
Console.WriteLine(forgot.Message);

// Step 2: Verify OTP and update password
var reset = await client.ResetPasswordAsync(
    identifier: "rohit@example.com",
    channel: "email",
    otpCode: "123456",
    newPassword: "BrandNewPassword@456",
    confirmNewPassword: "BrandNewPassword@456");

Console.WriteLine(reset.Message); // "Password has been reset successfully. You can now log in."
```

### 5. 14-Day Account Deletion Request

```csharp
var deletion = await client.RequestDeletionAsync(
    identifier: "rohit@example.com",
    password: "CurrentPassword@123",
    reason: "Switching accounts");

Console.WriteLine(deletion.Message); // Account deletion scheduled with 14-day grace period
```

---

## Error Hierarchy

```
TezzAuthException (base)
 ├── TezzConflictException (StatusCode: 409, ConflictField: "email" | "phone" | "both")
 ├── TezzRateLimitException (StatusCode: 429, RemainingAttempts, LockoutSeconds)
 └── TezzValidationException (StatusCode: 422, ValidationErrors)
```

---

## License

MIT (c) Tezz
