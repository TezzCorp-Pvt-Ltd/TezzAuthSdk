<?php

namespace TezzCorp\Auth;

use TezzCorp\Auth\Exceptions\TezzAuthException;
use TezzCorp\Auth\Exceptions\TezzRateLimitException;
use TezzCorp\Auth\Exceptions\TezzValidationException;
use TezzCorp\Auth\Exceptions\TezzConflictException;

class HttpClient
{
    public function __construct(
        protected string $baseUrl,
        protected int $timeout = 10,
        protected array $defaultHeaders = []
    ) {
        $this->baseUrl = rtrim($baseUrl, '/');
    }

    /**
     * Send HTTP request
     *
     * @param string $endpoint
     * @param string $method
     * @param array|null $body
     * @param array $headers
     * @return array
     * @throws TezzAuthException
     */
    public function request(string $endpoint, string $method = 'GET', ?array $body = null, array $headers = []): array
    {
        $url = $this->baseUrl . $endpoint;
        $ch = curl_init();

        $mergedHeaders = array_merge([
            'Content-Type: application/json',
            'Accept: application/json',
        ], $this->defaultHeaders, $headers);

        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, $this->timeout);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

        if ($body !== null) {
            $json = json_encode($body);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $json);
        }

        curl_setopt($ch, CURLOPT_HTTPHEADER, $mergedHeaders);

        $responseBody = curl_exec($ch);
        $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($responseBody === false) {
            throw new TezzAuthException("cURL request failed: {$curlError}", 500);
        }

        $decoded = json_decode($responseBody, true) ?? [];

        if ($statusCode >= 400) {
            if ($statusCode === 429) {
                throw new TezzRateLimitException(
                    $decoded['message'] ?? 'Rate limit exceeded',
                    $decoded['remaining_attempts'] ?? 0,
                    $decoded['lockout_seconds'] ?? 0,
                    $decoded
                );
            }

            if ($statusCode === 409) {
                throw new TezzConflictException(
                    $decoded['message'] ?? 'Account already registered',
                    $decoded['conflict_field'] ?? 'account',
                    $decoded
                );
            }

            if ($statusCode === 422) {
                throw new TezzValidationException(
                    $decoded['message'] ?? 'Validation failed',
                    $decoded['errors'] ?? [],
                    $decoded
                );
            }

            throw new TezzAuthException(
                $decoded['message'] ?? "Request failed with HTTP {$statusCode}",
                $statusCode,
                $decoded
            );
        }

        return $decoded;
    }
}
