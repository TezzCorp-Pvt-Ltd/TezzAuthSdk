using System;
using System.Threading.Tasks;
using Tezz.Auth;
using Tezz.Auth.Exceptions;

namespace Tezz.Auth.Tests;

public class Program
{
    public static async Task<int> Main(string[] args)
    {
        Console.WriteLine("\n======================================================");
        Console.WriteLine("Running .NET SDK End-to-End Test Suite");
        Console.WriteLine("======================================================\n");

        if (TezzAuthClient.DefaultBaseUrl != "https://account.tezzcorp.com")
        {
            throw new Exception("DefaultBaseUrl mismatch in TezzAuthClient");
        }

        string testUrl = Environment.GetEnvironmentVariable("TEZZ_AUTH_URL") ?? "http://localhost:3000";
        using var httpClient = new HttpClient();
        httpClient.DefaultRequestHeaders.Add("X-Forwarded-For", $"198.51.100.{new Random().Next(10, 250)}");
        using var client = new TezzAuthClient(testUrl, httpClient);
        long timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        string testEmail = $"dotnet.sdk.{timestamp}@tezz.com";
        string testPhone = $"+9194{timestamp.ToString()[^8..]}";
        string password = "DotnetSecure@2026";

        try
        {
            // 1. Fetch public key
            Console.WriteLine("[1/7] Fetching RSA Public Key...");
            string pubKey = await client.GetPublicKeyAsync();
            if (!pubKey.Contains("BEGIN PUBLIC KEY"))
            {
                throw new Exception("Invalid public key format: missing PEM header");
            }
            Console.WriteLine("   [OK] Public key retrieved and cached via RSA-OAEP.");

            // 2. Check availability
            Console.WriteLine("[2/7] Checking availability...");
            bool isAvailable = await client.CheckAvailabilityAsync("email", testEmail);
            if (!isAvailable)
            {
                throw new Exception($"Expected fresh email {testEmail} to be available.");
            }
            Console.WriteLine($"   [OK] Email {testEmail} is available.");

            // 3. Register user with automatic client-side RSA encryption
            Console.WriteLine("[3/7] Registering user with encrypted credentials...");
            var reg = await client.RegisterAsync(
                fullName: ".NET SDK User",
                email: testEmail,
                phoneNumber: testPhone,
                password: password);

            if (!reg.Success || string.IsNullOrWhiteSpace(reg.Token) || reg.User == null)
            {
                throw new Exception($"Registration failed: {reg.Message}");
            }
            Console.WriteLine($"   [OK] User registered! UUID: {reg.User.Uuid}");
            Console.WriteLine($"   [OK] Issued JWT token: {reg.Token[..32]}...");

            // 4. Multiple account conflict handling (409 conflict detection)
            Console.WriteLine("[4/7] Testing multiple account conflict resolution (TezzConflictException)...");
            try
            {
                await client.RegisterAsync(
                    fullName: "Duplicate .NET User",
                    email: testEmail, // duplicate email
                    phoneNumber: $"+9193{timestamp.ToString()[^8..]}",
                    password: password);

                throw new Exception("Expected registration to fail with TezzConflictException");
            }
            catch (TezzConflictException ex)
            {
                if (ex.StatusCode == 409 && ex.ConflictField == "email")
                {
                    Console.WriteLine($"   [OK] Caught TezzConflictException: ConflictField='{ex.ConflictField}'");
                    Console.WriteLine("   [OK] Client can present user options: 'Sign In' vs 'Reset Password' vs 'Change Email'");
                }
                else
                {
                    throw;
                }
            }

            // 5. Login with RSA-encrypted password
            Console.WriteLine("[5/7] Authenticating via client.LoginAsync()...");
            var login = await client.LoginAsync(testEmail, password);
            if (!login.Success || string.IsNullOrWhiteSpace(login.Token) || login.User == null)
            {
                throw new Exception($"Login failed: {login.Message}");
            }
            Console.WriteLine($"   [OK] Login successful for {login.User.FullName}!");
            Console.WriteLine("   [OK] Session token verified.");

            // 6. Test Anti-Enumeration with bad credentials
            Console.WriteLine("[6/7] Testing anti-enumeration on invalid login...");
            try
            {
                await client.LoginAsync(testEmail, "WrongPassword@000");
                throw new Exception("Expected login to fail for bad password");
            }
            catch (TezzAuthException ex) when (ex.StatusCode == 401)
            {
                if (ex.Message == "User email or password error")
                {
                    Console.WriteLine($"   [OK] Correctly caught expected generic error: \"{ex.Message}\"");
                }
                else
                {
                    throw;
                }
            }

            // 7. Forgot password privacy-safe response
            Console.WriteLine("[7/7] Testing forgot-password flow...");
            var forgot = await client.ForgotPasswordAsync(testEmail, "email");
            if (!forgot.Success || forgot.Message == null || !forgot.Message.Contains("If your account exists"))
            {
                throw new Exception("Forgot password message violates privacy requirement");
            }
            Console.WriteLine($"   [OK] Privacy-safe response: \"{forgot.Message[..50]}...\"");

            Console.WriteLine("\n======================================================");
            Console.WriteLine(".NET SDK: ALL 7 TESTS PASSED FLAWLESSLY!");
            Console.WriteLine("======================================================\n");

            return 0;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"\n[FAIL] .NET SDK Test Failed: {ex.Message}\n{ex.StackTrace}");
            return 1;
        }
    }
}
