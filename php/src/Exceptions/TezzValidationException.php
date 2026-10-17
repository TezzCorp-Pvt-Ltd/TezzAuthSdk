<?php

namespace TezzCorp\Auth\Exceptions;

class TezzValidationException extends TezzAuthException
{
    protected array $errors;

    public function __construct(string $message, array $errors = [], mixed $response = null)
    {
        parent::__construct($message, 422, $response);
        $this->errors = $errors;
    }

    public function getErrors(): array
    {
        return $this->errors;
    }
}
