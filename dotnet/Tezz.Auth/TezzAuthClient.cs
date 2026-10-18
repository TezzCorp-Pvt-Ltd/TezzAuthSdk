using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Tezz.Auth.Exceptions;
using Tezz.Auth.Models;

namespace Tezz.Auth;

public class TezzAuthClient : IDisposable
{
    private readonly string _baseUrl;
    private readonly HttpClient _httpClient;
    private readonly bool _ownsHttpClient;
    private readonly TimeSpan _keyCacheTtl;

    private string? _cachedPublicKey;
    private DateTime _keyExpiresAt = DateTime.MinValue;
    private readonly SemaphoreSlim _keyLock = new(1, 1);

    public const string DefaultBaseUrl = "https://account.tezzcorp.com";

    public TezzAuthClient(
        string baseUrl = DefaultBaseUrl,
        HttpClient? httpClient = null,
        TimeSpan? timeout = null,
        TimeSpan? keyCacheTtl = null)
    {
        _baseUrl = baseUrl.TrimEnd('/');
        _keyCacheTtl = keyCacheTtl ?? TimeSpan.FromHours(1);

        if (httpClient != null)
        {
            _httpClient = httpClient;
            _ownsHttpClient = false;
        }
        else
        {
            _httpClient = new HttpClient
            {
                Timeout = timeout ?? TimeSpan.FromSeconds(10)
            };
            _ownsHttpClient = true;
        }
    }

    /// <summary>
    /// Fetches and caches the server RSA public key with rolling TTL.
    /// </summary>
    public async Task<string> GetPublicKeyAsync(CancellationToken cancellationToken = default)
    {
        if (_cachedPublicKey != null && DateTime.UtcNow < _keyExpiresAt)
        {
            return _cachedPublicKey;
        }

        await _keyLock.WaitAsync(cancellationToken);
        try
        {
            if (_cachedPublicKey != null && DateTime.UtcNow < _keyExpiresAt)
            {
                return _cachedPublicKey;
            }

            var response = await SendRequestAsync<AuthResponse>(
                HttpMethod.Get,
                "/api/v1/auth/public-key",
                null,
                cancellationToken);

            if (string.IsNullOrWhiteSpace(response.PublicKey))
            {
                throw new TezzAuthException("Invalid response from public-key endpoint: key is missing.", 500);
            }

            _cachedPublicKey = response.PublicKey;
            _keyExpiresAt = DateTime.UtcNow.Add(_keyCacheTtl);
            return _cachedPublicKey;
        }
        finally
        {
            _keyLock.Release();
        }
    }

    /// <summary>
    /// Checks live availability of an email address or phone number.
    /// </summary>
    public async Task<bool> CheckAvailabilityAsync(string type, string value, CancellationToken cancellationToken = default)
    {
        var payload = new Dictionary<string, string>
        {
            ["type"] = type,
            ["value"] = value
        };

        var response = await SendRequestAsync<AuthResponse>(
            HttpMethod.Post,
            "/api/v1/auth/check-availability",
            payload,
            cancellationToken);

        return response.Available ?? false;
    }

    /// <summary>
    /// Registers a new user with client-side RSA encrypted passwords.
    /// </summary>
    public async Task<AuthResponse> RegisterAsync(
        string fullName,
        string email,
        string phoneNumber,
        string password,
        string? confirmPassword = null,
        CancellationToken cancellationToken = default)
    {
        var pubKey = await GetPublicKeyAsync(cancellationToken);
        confirmPassword ??= password;

        var passwordEncrypted = TezzCrypto.Encrypt(pubKey, password);
        var confirmPasswordEncrypted = TezzCrypto.Encrypt(pubKey, confirmPassword);

        var payload = new Dictionary<string, object>
        {
            ["full_name"] = fullName,
            ["email"] = email,
            ["phone_number"] = phoneNumber,
            ["password_encrypted"] = passwordEncrypted,
            ["confirm_password_encrypted"] = confirmPasswordEncrypted
        };

        return await SendRequestAsync<AuthResponse>(
            HttpMethod.Post,
            "/api/v1/auth/register",
            payload,
            cancellationToken);
    }

    /// <summary>
    /// Authenticates user credentials with client-side RSA encrypted password.
    /// Automatically cancels any pending account deletion.
    /// </summary>
    public async Task<AuthResponse> LoginAsync(
        string identifier,
        string password,
        CancellationToken cancellationToken = default)
    {
        var pubKey = await GetPublicKeyAsync(cancellationToken);
        var passwordEncrypted = TezzCrypto.Encrypt(pubKey, password);

        var payload = new Dictionary<string, string>
        {
            ["identifier"] = identifier,
            ["password_encrypted"] = passwordEncrypted
        };

        return await SendRequestAsync<AuthResponse>(
            HttpMethod.Post,
            "/api/v1/auth/login",
            payload,
            cancellationToken);
    }

    /// <summary>
    /// Initiates password recovery OTP flow.
    /// </summary>
    public async Task<AuthResponse> ForgotPasswordAsync(
        string identifier,
        string channel = "email",
        CancellationToken cancellationToken = default)
    {
        var payload = new Dictionary<string, string>
        {
            ["identifier"] = identifier,
            ["channel"] = channel
        };

        return await SendRequestAsync<AuthResponse>(
            HttpMethod.Post,
            "/api/v1/auth/forgot-password",
            payload,
            cancellationToken);
    }

    /// <summary>
    /// Completes password reset with verified OTP.
    /// </summary>
    public async Task<AuthResponse> ResetPasswordAsync(
        string identifier,
        string channel,
        string otpCode,
        string newPassword,
        string? confirmNewPassword = null,
        CancellationToken cancellationToken = default)
    {
        var pubKey = await GetPublicKeyAsync(cancellationToken);
        confirmNewPassword ??= newPassword;

        var newPasswordEncrypted = TezzCrypto.Encrypt(pubKey, newPassword);
        var confirmNewPasswordEncrypted = TezzCrypto.Encrypt(pubKey, confirmNewPassword);

        var payload = new Dictionary<string, string>
        {
            ["identifier"] = identifier,
            ["channel"] = channel,
            ["otp_code"] = otpCode,
            ["new_password_encrypted"] = newPasswordEncrypted,
            ["confirm_new_password_encrypted"] = confirmNewPasswordEncrypted
        };

        return await SendRequestAsync<AuthResponse>(
            HttpMethod.Post,
            "/api/v1/auth/reset-password",
            payload,
            cancellationToken);
    }

    /// <summary>
    /// Initiates a 14-day grace account deletion request.
    /// </summary>
    public async Task<AuthResponse> RequestDeletionAsync(
        string identifier,
        string password,
        string? reason = null,
        CancellationToken cancellationToken = default)
    {
        var pubKey = await GetPublicKeyAsync(cancellationToken);
        var passwordEncrypted = TezzCrypto.Encrypt(pubKey, password);

        var payload = new Dictionary<string, string>
        {
            ["identifier"] = identifier,
            ["password_encrypted"] = passwordEncrypted
        };

        if (!string.IsNullOrWhiteSpace(reason))
        {
            payload["reason"] = reason;
        }

        return await SendRequestAsync<AuthResponse>(
            HttpMethod.Post,
            "/api/v1/auth/request-deletion",
            payload,
            cancellationToken);
    }

    /// <summary>
    /// Retrieves current verified user profile using bearer token.
    /// </summary>
    public async Task<AuthResponse> GetProfileAsync(string token, CancellationToken cancellationToken = default)
    {
        var requestUrl = $"{_baseUrl}/api/v1/auth/me";
        using var request = new HttpRequestMessage(HttpMethod.Get, requestUrl);
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        HttpResponseMessage response;
        try
        {
            response = await _httpClient.SendAsync(request, cancellationToken);
        }
        catch (Exception ex)
        {
            throw new TezzAuthException($"Network error connecting to {requestUrl}: {ex.Message}", 500);
        }

        var responseContent = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new TezzAuthException($"Failed to retrieve profile: HTTP {(int)response.StatusCode}", (int)response.StatusCode, responseContent);
        }

        return JsonSerializer.Deserialize<AuthResponse>(responseContent)
            ?? throw new TezzAuthException("Empty response from profile endpoint.", 500);
    }

    /// <summary>
    /// Cancels pending 14-day account deletion.
    /// </summary>
    public async Task<AuthResponse> CancelDeletionAsync(string token, CancellationToken cancellationToken = default)
    {
        var requestUrl = $"{_baseUrl}/api/v1/auth/cancel-deletion";
        using var request = new HttpRequestMessage(HttpMethod.Post, requestUrl);
        request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        HttpResponseMessage response;
        try
        {
            response = await _httpClient.SendAsync(request, cancellationToken);
        }
        catch (Exception ex)
        {
            throw new TezzAuthException($"Network error connecting to {requestUrl}: {ex.Message}", 500);
        }

        var responseContent = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new TezzAuthException($"Failed to cancel deletion: HTTP {(int)response.StatusCode}", (int)response.StatusCode, responseContent);
        }

        return JsonSerializer.Deserialize<AuthResponse>(responseContent)
            ?? throw new TezzAuthException("Empty response from cancel deletion endpoint.", 500);
    }

    private async Task<T> SendRequestAsync<T>(
        HttpMethod method,
        string endpoint,
        object? body,
        CancellationToken cancellationToken)
    {
        var requestUrl = $"{_baseUrl}{endpoint}";
        using var request = new HttpRequestMessage(method, requestUrl);

        if (body != null)
        {
            var json = JsonSerializer.Serialize(body);
            request.Content = new StringContent(json, Encoding.UTF8, "application/json");
        }

        HttpResponseMessage response;
        try
        {
            response = await _httpClient.SendAsync(request, cancellationToken);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new TezzAuthException($"Network error connecting to {requestUrl}: {ex.Message}", 500);
        }

        var responseContent = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            int statusCode = (int)response.StatusCode;
            AuthResponse? errorModel = null;
            try
            {
                errorModel = JsonSerializer.Deserialize<AuthResponse>(responseContent);
            }
            catch
            {
                // Ignore parse failures
            }

            var message = errorModel?.Message ?? $"Request failed with HTTP {statusCode}";

            if (statusCode == 409)
            {
                var conflictField = errorModel?.ConflictField ?? "account";
                throw new TezzConflictException(message, conflictField, responseContent);
            }

            if (statusCode == 429)
            {
                var remaining = errorModel?.RemainingAttempts ?? 0;
                var lockout = errorModel?.LockoutSeconds ?? 0;
                throw new TezzRateLimitException(message, remaining, lockout, responseContent);
            }

            if (statusCode == 422)
            {
                throw new TezzValidationException(message, responseContent, responseContent);
            }

            throw new TezzAuthException(message, statusCode, responseContent);
        }

        var result = JsonSerializer.Deserialize<T>(responseContent);
        if (result == null)
        {
            throw new TezzAuthException("Received empty or invalid JSON response from server.", (int)response.StatusCode, responseContent);
        }

        return result;
    }

    public void Dispose()
    {
        if (_ownsHttpClient)
        {
            _httpClient.Dispose();
        }
        _keyLock.Dispose();
        GC.SuppressFinalize(this);
    }
}
