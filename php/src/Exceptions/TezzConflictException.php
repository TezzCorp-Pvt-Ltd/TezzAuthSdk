<?php

namespace Tezz\Auth\Exceptions;

class TezzConflictException extends TezzAuthException
{
    protected string $conflictField;

    public function __construct(string $message = "Account already exists", string $conflictField = "account", mixed $response = null)
    {
        parent::__construct($message, 409, $response);
        $this->conflictField = $conflictField;
    }

    public function getConflictField(): string
    {
        return $this->conflictField;
    }
}
