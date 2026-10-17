namespace Tezz.Auth.Exceptions;

public class TezzRateLimitException : TezzAuthException
{
    public int RemainingAttempts { get; }
    public int LockoutSeconds { get; }

    public TezzRateLimitException(string message, int remainingAttempts, int lockoutSeconds, string? responseBody = null)
        : base(message, 429, responseBody)
    {
        RemainingAttempts = remainingAttempts;
        LockoutSeconds = lockoutSeconds;
    }
}
