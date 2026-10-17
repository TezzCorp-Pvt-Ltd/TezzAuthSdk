<?php

namespace Tezz\Auth;

class TezzUser
{
    public function __construct(
        public readonly string $uuid,
        public readonly string $fullName,
        public readonly string $email,
        public readonly string $phoneNumber,
        public readonly bool $isEmailVerified,
        public readonly bool $isPhoneVerified
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            uuid: $data['uuid'] ?? '',
            fullName: $data['full_name'] ?? '',
            email: $data['email'] ?? '',
            phoneNumber: $data['phone_number'] ?? '',
            isEmailVerified: (bool)($data['is_email_verified'] ?? false),
            isPhoneVerified: (bool)($data['is_phone_verified'] ?? false)
        );
    }
}
