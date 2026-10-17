<?php

namespace Tezz\Auth;

use Tezz\Auth\Exceptions\TezzAuthException;

class Crypto
{
    /**
     * Encrypt plaintext string using RSA-OAEP with SHA-256 padding
     *
     * @param string $publicKeyPem
     * @param string $plaintext
     * @return string Base64 encoded ciphertext
     * @throws TezzAuthException
     */
    public static function encrypt(string $publicKeyPem, string $plaintext): string
    {
        $encrypted = '';
        $success = openssl_public_encrypt(
            $plaintext,
            $encrypted,
            $publicKeyPem,
            OPENSSL_PKCS1_OAEP_PADDING
        );

        if (!$success) {
            $error = openssl_error_string() ?: 'Unknown OpenSSL error';
            throw new TezzAuthException("RSA encryption failed: {$error}");
        }

        return base64_encode($encrypted);
    }
}
