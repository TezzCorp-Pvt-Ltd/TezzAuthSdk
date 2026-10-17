<?php

/**
 * End-to-End Test for Tezz PHP SDK
 */

// Simple PSR-4 Autoloader for standalone testing
spl_autoload_register(function ($class) {
    $prefix = 'Tezz\\Auth\\';
    $base_dir = __DIR__ . '/src/';
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) return;
    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';
    if (file_exists($file)) require $file;
});

use Tezz\Auth\TezzAuthClient;
use Tezz\Auth\Exceptions\TezzAuthException;
use Tezz\Auth\Exceptions\TezzConflictException;

echo "\n======================================================\n";
echo "Running PHP Composer SDK End-to-End Test Suite\n";
echo "======================================================\n\n";

$client = new TezzAuthClient([
    'base_url' => 'http://localhost:3000',
    'headers'  => ['X-Forwarded-For: 198.51.100.42'],
]);
$timestamp = time();
$testEmail = "php.sdk.{$timestamp}@tezz.com";
$testPhone = "+9198" . substr((string)$timestamp, -8);
$password = "PhpSecure@2026";

// 1. Fetch public key
echo "[1/6] Fetching RSA Public Key...\n";
$pubKey = $client->getPublicKey();
if (!str_contains($pubKey, 'BEGIN PUBLIC KEY')) {
    throw new Exception("Invalid public key format");
}
echo "   [OK] Public key retrieved via OpenSSL.\n";

// 2. Check availability
echo "[2/6] Checking availability...\n";
$avail = $client->checkAvailability('email', $testEmail);
if (!$avail) throw new Exception("Expected email to be available");
echo "   [OK] Email is available.\n";

// 3. Register user with encrypted password
echo "[3/6] Registering user with encrypted credentials...\n";
$reg = $client->register(
    fullName: "PHP SDK User",
    email: $testEmail,
    phoneNumber: $testPhone,
    password: $password
);

if (!$reg->success || empty($reg->token)) {
    throw new Exception("Registration failed");
}
echo "   [OK] User registered! UUID: {$reg->user->uuid}\n";
echo "   [OK] JWT Token: " . substr($reg->token, 0, 32) . "...\n";

// 4. Multiple account conflict handling (409 conflict detection)
echo "[4/6] Testing multiple account conflict resolution (TezzConflictException)...\n";
try {
    $client->register(
        fullName: "Duplicate PHP User",
        email: $testEmail, // same email
        phoneNumber: "+9195" . substr((string)$timestamp, -8),
        password: $password
    );
    throw new Exception("Expected registration to fail with TezzConflictException");
} catch (TezzConflictException $e) {
    if ($e->getStatusCode() === 409 && $e->getConflictField() === 'email') {
        echo "   [OK] Caught TezzConflictException: conflictField='{$e->getConflictField()}'\n";
        echo "   [OK] Client can present user options: 'Sign In' vs 'Reset Password' vs 'Change Email'\n";
    } else {
        throw $e;
    }
}

// 5. Login
echo "[5/6] Logging in with encrypted password...\n";
$login = $client->login($testEmail, $password);
if (!$login->success || empty($login->token)) {
    throw new Exception("Login failed");
}
echo "   [OK] Logged in successfully as: {$login->user->fullName}\n";

// 6. Anti-enumeration test
echo "[6/6] Testing anti-enumeration error handling...\n";
try {
    $client->login($testEmail, "WrongPassword@000");
    throw new Exception("Expected login to fail");
} catch (TezzAuthException $e) {
    if ($e->getStatusCode() === 401 && $e->getMessage() === 'User email or password error') {
        echo "   [OK] Caught expected generic error: {$e->getMessage()}\n";
    } else {
        throw $e;
    }
}

echo "\n======================================================\n";
echo "PHP SDK: ALL 6 TESTS PASSED FLAWLESSLY!\n";
echo "======================================================\n\n";
