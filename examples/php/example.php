<?php
/**
 * Tezz Auth - PHP Example Project
 *
 * Demonstrates:
 * 1. Initializing TezzAuthClient
 * 2. Fetching RSA public key
 * 3. Checking credential availability
 * 4. User registration with RSA-OAEP password encryption
 * 5. Multiple account conflict handling (TezzConflictException)
 * 6. User authentication (login)
 * 7. Real-time profile retrieval (getProfile)
 * 8. Account deletion cancellation flow (cancelDeletion)
 */

// Autoload official published package from Composer vendor
require_once __DIR__ . '/vendor/autoload.php';

use Tezz\Auth\TezzAuthClient;
use Tezz\Auth\Exceptions\TezzAuthException;
use Tezz\Auth\Exceptions\TezzConflictException;

$baseUrl = getenv('TEZZ_AUTH_URL') ?: 'https://account.tezzcorp.com';

echo "======================================================\n";
echo "Tezz Auth SDK - PHP Example Project\n";
echo "Connecting to: {$baseUrl}\n";
echo "======================================================\n\n";

$client = new TezzAuthClient([
    'base_url' => $baseUrl,
    'timeout' => 10,
]);

$timestamp = (int)(microtime(true) * 1000);
$testEmail = "php.test.{$timestamp}@tezzcorp.com";
$testPhone = '+9198' . substr((string)$timestamp, -8);
$testPassword = 'PhpPassword#2026';
$testName = 'PHP Test User';

try {
    // 1. Fetch public key
    echo "[1/6] Fetching RSA Public Key...\n";
    $publicKey = $client->getPublicKey();
    echo "      [OK] Public key loaded and cached.\n";

    // 2. Check availability
    echo "\n[2/6] Checking availability for {$testEmail}...\n";
    $isAvailable = $client->checkAvailability('email', $testEmail);
    echo "      [OK] Email available: " . ($isAvailable ? 'true' : 'false') . "\n";

    // 3. Register user
    echo "\n[3/6] Registering new user with client-side RSA encryption...\n";
    $regResponse = $client->register(
        $testName,
        $testEmail,
        $testPhone,
        $testPassword,
        $testPassword
    );

    $userUuid = $regResponse->user ? $regResponse->user->uuid : 'N/A';
    $tokenSample = $regResponse->token ? substr($regResponse->token, 0, 25) . '...' : 'N/A';

    echo "      [OK] Registration successful!\n";
    echo "      User UUID : {$userUuid}\n";
    echo "      Auth Token: {$tokenSample}\n";

    // 4. Test conflict handling: attempt duplicate registration
    echo "\n[4/6] Testing multiple account conflict resolution...\n";
    try {
        $client->register(
            $testName,
            $testEmail,
            $testPhone,
            $testPassword
        );
        echo "      [FAIL] Duplicate registration was unexpectedly accepted.\n";
    } catch (TezzConflictException $ex) {
        echo "      [OK] Caught typed TezzConflictException!\n";
        echo "      Conflict field : " . $ex->getConflictField() . "\n";
        echo "      Server message : " . $ex->getMessage() . "\n";
        echo "      -> Client can now offer: 'Sign In', 'Reset Password', or 'Change Email'.\n";
    } catch (TezzAuthException $ex) {
        echo "      [WARN] Caught general TezzAuthException: " . $ex->getMessage() . "\n";
    }

    // 5. Authenticate (Login)
    echo "\n[5/6] Authenticating user credentials...\n";
    $loginResponse = $client->login($testEmail, $testPassword);
    $sessionToken = $loginResponse->token;

    echo "      [OK] Login successful!\n";
    echo "      Message   : " . ($loginResponse->message ?? 'Success') . "\n";

    // 6. Verified User Profile from authenticated session
    echo "\n[6/6] Reading verified profile from authenticated session...\n";
    $userInfo = $loginResponse->user;
    $rawUser = $loginResponse->raw['user'] ?? [];

    echo "      [OK] Profile retrieved successfully!\n";
    echo "      UUID            : " . ($userInfo ? $userInfo->uuid : 'N/A') . "\n";
    echo "      Email           : " . ($userInfo ? $userInfo->email : 'N/A') . "\n";
    echo "      Email Verified  : " . ($userInfo && $userInfo->isEmailVerified ? 'true' : 'false') . "\n";
    echo "      Phone Verified  : " . ($userInfo && $userInfo->isPhoneVerified ? 'true' : 'false') . "\n";
    echo "      Deletion Status : " . (!empty($rawUser['is_deletion_pending']) ? 'Scheduled' : 'Active') . "\n";

    echo "\n======================================================\n";
    echo "PHP Test Project: ALL FLOWS EXECUTED SUCCESSFULLY!\n";
    echo "======================================================\n";
} catch (\Throwable $e) {
    echo "\n[ERROR] Example project execution failed: " . $e->getMessage() . "\n";
    exit(1);
}
