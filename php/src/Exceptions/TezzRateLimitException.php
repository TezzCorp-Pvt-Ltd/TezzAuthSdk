<?php

namespace Tezz\Auth\Exceptions;

class TezzRateLimitException extends TezzAuthException
{
    protected int $remainingAttempts;
    protected int $lockoutSeconds;

    public function __construct(string $message, int $remainingAttempts, int $lockoutSeconds, mixed $response = null)
    {
        parent::__construct($message, 429, $response);
        $this->remainingAttempts = $remainingAttempts;
        $this->lockoutSeconds = $lockoutSeconds;
    }

    public function getRemainingAttempts(): int
    {
        return $this->remainingAttempts;
    }

    public function getLockoutSeconds(): int
    {
        return $this->lockoutSeconds;
    }
}
