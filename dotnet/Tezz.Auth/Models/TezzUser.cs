using System.Text.Json.Serialization;

namespace Tezz.Auth.Models;

public class TezzUser
{
    [JsonPropertyName("uuid")]
    public string Uuid { get; set; } = string.Empty;

    [JsonPropertyName("full_name")]
    public string FullName { get; set; } = string.Empty;

    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [JsonPropertyName("phone_number")]
    public string PhoneNumber { get; set; } = string.Empty;

    [JsonPropertyName("is_email_verified")]
    [JsonConverter(typeof(BoolOrIntConverter))]
    public bool IsEmailVerified { get; set; }

    [JsonPropertyName("is_phone_verified")]
    [JsonConverter(typeof(BoolOrIntConverter))]
    public bool IsPhoneVerified { get; set; }
}
