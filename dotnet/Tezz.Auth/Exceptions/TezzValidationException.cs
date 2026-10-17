namespace Tezz.Auth.Exceptions;

public class TezzValidationException : TezzAuthException
{
    public string? ValidationErrors { get; }

    public TezzValidationException(string message, string? validationErrors = null, string? responseBody = null)
        : base(message, 422, responseBody)
    {
        ValidationErrors = validationErrors;
    }
}
