using System;

namespace Tezz.Auth.Exceptions;

public class TezzAuthException : Exception
{
    public int StatusCode { get; }
    public string? ResponseBody { get; }

    public TezzAuthException(string message, int statusCode = 500, string? responseBody = null)
        : base(message)
    {
        StatusCode = statusCode;
        ResponseBody = responseBody;
    }
}
