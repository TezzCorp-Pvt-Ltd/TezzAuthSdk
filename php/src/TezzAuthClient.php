<?php

namespace Tezz\Auth;

use Tezz\Auth\Exceptions\TezzAuthException;

class TezzAuthClient
{
    public const DEFAULT_BASE_URL = 'https://account.tezzcorp.com';

    protected HttpClient $http;
    protected ?string $cachedPublicKey = null;
    protected int $keyExpiresAt = 0;
    protected int $keyTtl = 3600;

    /**
     * @param array{base_url?: string, timeout?: int, key_ttl?: int, headers?: array} $config
     */
    public function __construct(array $config = [])
    {
        $baseUrl = $config['base_url'] ?? self::DEFAULT_BASE_URL;
        $timeout = $config['timeout'] ?? 10;
        $this->keyTtl = $config['key_ttl'] ?? 3600;
        $headers = $config['headers'] ?? [];

        $this->http = new HttpClient($baseUrl, $timeout, $headers);
    }

    /**
     * Fetch and cache server RSA public key
     *
     * @return string PEM public key
     * @throws TezzAuthException
     */
    public function getPublicKey(): string
    {
        $now = time();
        if ($this->cachedPublicKey !== null && $now < $this->keyExpiresAt) {
            return $this->cachedPublicKey;
        }

        $res = $this->http->request('/api/v1/auth/public-key', 'GET');
        if (empty($res['public_key'])) {
            throw new TezzAuthException('Public key missing from response', 500, $res);
        }

        $this->cachedPublicKey = $res['public_key'];
        $this->keyExpiresAt = $now + $this->keyTtl;

        return $this->cachedPublicKey;
    }

    /**
     * Register a new user with RSA encrypted password
     */
    public function register(
        string $fullName,
        string $email,
        string $phoneNumber,
        string $password,
        ?string $confirmPassword = null
    ): Response {
        $pubKey = $this->getPublicKey();
        $confirmPassword ??= $password;

        $passwordEncrypted = Crypto::encrypt($pubKey, $password);
        $confirmPasswordEncrypted = Crypto::encrypt($pubKey, $confirmPassword);

        $data = $this->http->request('/api/v1/auth/register', 'POST', [
            'full_name' => $fullName,
            'email' => $email,
            'phone_number' => $phoneNumber,
            'password_encrypted' => $passwordEncrypted,
            'confirm_password_encrypted' => $confirmPasswordEncrypted,
        ]);

        return Response::fromArray($data);
    }

    /**
     * Live availability check for email or phone
     */
    public function checkAvailability(string $type, string $value): bool
    {
        $data = $this->http->request('/api/v1/auth/check-availability', 'POST', [
            'type' => $type,
            'value' => $value,
        ]);

        return (bool)($data['available'] ?? false);
    }

    /**
     * Authenticate user credentials
     */
    public function login(string $identifier, string $password): Response
    {
        $pubKey = $this->getPublicKey();
        $passwordEncrypted = Crypto::encrypt($pubKey, $password);

        $data = $this->http->request('/api/v1/auth/login', 'POST', [
            'identifier' => $identifier,
            'password_encrypted' => $passwordEncrypted,
        ]);

        return Response::fromArray($data);
    }

    /**
     * Initiate password recovery OTP
     */
    public function forgotPassword(string $identifier, string $channel = 'email'): Response
    {
        $data = $this->http->request('/api/v1/auth/forgot-password', 'POST', [
            'identifier' => $identifier,
            'channel' => $channel,
        ]);

        return Response::fromArray($data);
    }

    /**
     * Reset password with OTP
     */
    public function resetPassword(
        string $identifier,
        string $channel,
        string $otpCode,
        string $newPassword,
        ?string $confirmNewPassword = null
    ): Response {
        $pubKey = $this->getPublicKey();
        $confirmNewPassword ??= $newPassword;

        $newPasswordEncrypted = Crypto::encrypt($pubKey, $newPassword);
        $confirmNewPasswordEncrypted = Crypto::encrypt($pubKey, $confirmNewPassword);

        $data = $this->http->request('/api/v1/auth/reset-password', 'POST', [
            'identifier' => $identifier,
            'channel' => $channel,
            'otp_code' => $otpCode,
            'new_password_encrypted' => $newPasswordEncrypted,
            'confirm_new_password_encrypted' => $confirmNewPasswordEncrypted,
        ]);

        return Response::fromArray($data);
    }
}
