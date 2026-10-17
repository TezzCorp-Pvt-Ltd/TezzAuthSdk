<?php

namespace TezzCorp\Auth\Exceptions;

use Exception;

class TezzAuthException extends Exception
{
    protected int $statusCode;
    protected mixed $response;

    public function __construct(string $message = "", int $statusCode = 500, mixed $response = null)
    {
        parent::__construct($message, $statusCode);
        $this->statusCode = $statusCode;
        $this->response = $response;
    }

    public function getStatusCode(): int
    {
        return $this->statusCode;
    }

    public function getResponse(): mixed
    {
        return $this->response;
    }
}
