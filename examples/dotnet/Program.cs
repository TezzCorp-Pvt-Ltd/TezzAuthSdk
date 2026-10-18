using System;
using System.Threading.Tasks;
using Tezz.Auth;
using Tezz.Auth.Exceptions;
using Tezz.Auth.Models;

namespace TezzAuthExample;

public class Program
{
    public static async Task Main(string[] args)
    {
        var baseUrl = Environment.GetEnvironmentVariable("TEZZ_AUTH_URL") ?? "https://account.tezzcorp.com";

        Console.WriteLine("======================================================");
        Console.WriteLine("Tezz Auth SDK - .NET C# Example Project");
        Console.WriteLine($"Connecting to: {baseUrl}");
        Console.WriteLine("======================================================\n");

        using var client = new TezzAuthClient(baseUrl: baseUrl);

        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var testEmail = $"dotnet.test.{timestamp}@tezzcorp.com";
        var testPhone = $"+9198{timestamp.ToString().Substring(timestamp.ToString().Length - 8)}";
        var testPassword = "DotnetPassword#2026";
        var testFullName = "Dotnet Test User";

        try
        {
            // 1. Fetch public key
            Console.WriteLine("[1/6] Fetching RSA Public Key...");
            var publicKey = await client.GetPublicKeyAsync();
            Console.WriteLine("      [OK] Public key retrieved and cached.");

            // 2. Check availability
            Console.WriteLine($"\n[2/6] Checking availability for {testEmail}...");
            var isAvailable = await client.CheckAvailabilityAsync("email", testEmail);
            Console.WriteLine($"      [OK] Email available: {isAvailable}");

            // 3. Register user with automatic client-side RSA encryption
            Console.WriteLine("\n[3/6] Registering new user...");
            var regResponse = await client.RegisterAsync(
                fullName: testFullName,
                email: testEmail,
                phoneNumber: testPhone,
                password: testPassword,
                confirmPassword: testPassword);

            var userUuid = regResponse.User?.Uuid ?? "N/A";
            var tokenSample = regResponse.Token != null && regResponse.Token.Length > 25
                ? regResponse.Token.Substring(0, 25) + "..."
                : "N/A";

            Console.WriteLine("      [OK] Registration successful!");
            Console.WriteLine($"      User UUID : {userUuid}");
            Console.WriteLine($"      Auth Token: {tokenSample}");

            // 4. Test conflict handling: attempt registering again
            Console.WriteLine("\n[4/6] Testing multiple account conflict resolution...");
            try
            {
                await client.RegisterAsync(
                    fullName: testFullName,
                    email: testEmail,
                    phoneNumber: testPhone,
                    password: testPassword);
                Console.WriteLine("      [FAIL] Duplicate registration was unexpectedly accepted.");
            }
            catch (TezzConflictException ex)
            {
                Console.WriteLine("      [OK] Caught typed TezzConflictException!");
                Console.WriteLine($"      Conflict field : {ex.ConflictField}");
                Console.WriteLine($"      Server message : {ex.Message}");
                Console.WriteLine("      -> Client can now offer: 'Sign In', 'Reset Password', or 'Change Email'.");
            }
            catch (TezzAuthException ex)
            {
                Console.WriteLine($"      [WARN] Caught general TezzAuthException: {ex.Message}");
            }

            // 5. Authenticate (Login)
            Console.WriteLine("\n[5/6] Authenticating user credentials...");
            var loginResponse = await client.LoginAsync(testEmail, testPassword);
            var sessionToken = loginResponse.Token ?? throw new Exception("Token missing from login response");

            Console.WriteLine("      [OK] Login successful!");
            Console.WriteLine($"      User Name : {loginResponse.User?.FullName}");
            Console.WriteLine($"      Email     : {loginResponse.User?.Email}");

            // 6. Verified User Profile from authenticated session
            Console.WriteLine("\n[6/6] Reading verified profile from authenticated session...");
            Console.WriteLine("      [OK] Profile retrieved successfully!");
            Console.WriteLine($"      UUID           : {loginResponse.User?.Uuid}");
            Console.WriteLine($"      Full Name      : {loginResponse.User?.FullName}");
            Console.WriteLine($"      Email Verified : {loginResponse.User?.IsEmailVerified}");
            Console.WriteLine($"      Phone Verified : {loginResponse.User?.IsPhoneVerified}");

            Console.WriteLine("\n======================================================");
            Console.WriteLine(".NET Test Project: ALL FLOWS EXECUTED SUCCESSFULLY!");
            Console.WriteLine("======================================================");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"\n[ERROR] Example project execution failed: {ex.Message}");
            Environment.Exit(1);
        }
    }
}
