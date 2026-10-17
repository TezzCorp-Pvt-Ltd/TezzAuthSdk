<?php

namespace Tezz\Auth;

class Response
{
    public function __construct(
        public readonly bool $success,
        public readonly ?string $message = null,
        public readonly ?string $token = null,
        public readonly ?TezzUser $user = null,
        public readonly ?bool $available = null,
        public readonly ?int $remainingAttempts = null,
        public readonly ?int $lockoutSeconds = null,
        public readonly array $raw = []
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            success: (bool)($data['success'] ?? false),
            message: $data['message'] ?? null,
            token: $data['token'] ?? null,
            user: isset($data['user']) ? TezzUser::fromArray($data['user']) : null,
            available: $data['available'] ?? null,
            remainingAttempts: $data['remaining_attempts'] ?? null,
            lockoutSeconds: $data['lockout_seconds'] ?? null,
            raw: $data
        );
    }
}
