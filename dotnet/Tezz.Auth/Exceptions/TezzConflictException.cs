namespace Tezz.Auth.Exceptions;

public class TezzConflictException : TezzAuthException
{
    public string ConflictField { get; }

    public TezzConflictException(string message, string conflictField = "account", string? responseBody = null)
        : base(message, 409, responseBody)
    {
        ConflictField = string.IsNullOrWhiteSpace(conflictField) ? "account" : conflictField;
    }
}
