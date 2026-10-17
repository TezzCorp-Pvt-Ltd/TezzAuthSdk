using System.Text.Json.Serialization;

namespace Tezz.Auth.Models;

public class AuthResponse
{
    [JsonPropertyName("success")]
    public bool Success { get; set; }

    [JsonPropertyName("message")]
    public string? Message { get; set; }

    [JsonPropertyName("token")]
    public string? Token { get; set; }

    [JsonPropertyName("user")]
    public TezzUser? User { get; set; }

    [JsonPropertyName("available")]
    [JsonConverter(typeof(NullableBoolOrIntConverter))]
    public bool? Available { get; set; }

    [JsonPropertyName("conflict_field")]
    public string? ConflictField { get; set; }

    [JsonPropertyName("remaining_attempts")]
    public int? RemainingAttempts { get; set; }

    [JsonPropertyName("lockout_seconds")]
    public int? LockoutSeconds { get; set; }

    [JsonPropertyName("public_key")]
    public string? PublicKey { get; set; }
}
