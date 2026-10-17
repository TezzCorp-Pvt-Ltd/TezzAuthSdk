using System;
using System.Security.Cryptography;
using System.Text;
using Tezz.Auth.Exceptions;

namespace Tezz.Auth;

public static class TezzCrypto
{
    /// <summary>
    /// Encrypt plaintext using RSA-OAEP with SHA-256 padding.
    /// </summary>
    /// <param name="publicKeyPem">Server RSA-2048 public key in PEM format</param>
    /// <param name="plaintext">Sensitive field string to encrypt</param>
    /// <returns>Base64 encoded ciphertext</returns>
    public static string Encrypt(string publicKeyPem, string plaintext)
    {
        try
        {
            using var rsa = RSA.Create();
            rsa.ImportFromPem(publicKeyPem.AsSpan());
            byte[] plainBytes = Encoding.UTF8.GetBytes(plaintext);
            byte[] cipherBytes = rsa.Encrypt(plainBytes, RSAEncryptionPadding.OaepSHA256);
            return Convert.ToBase64String(cipherBytes);
        }
        catch (Exception ex)
        {
            throw new TezzAuthException($"RSA encryption failed: {ex.Message}", 500);
        }
    }
}
