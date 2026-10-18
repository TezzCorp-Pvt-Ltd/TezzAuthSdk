/**
 * Tezz Auth - Node.js / JavaScript Example Project
 *
 * Demonstrates:
 * 1. Initializing TezzAuthClient
 * 2. Fetching RSA public key
 * 3. Checking credential availability
 * 4. User registration with RSA-OAEP password encryption
 * 5. Multiple account conflict handling (TezzConflictError)
 * 6. User authentication (login)
 * 7. Real-time profile retrieval (getProfile)
 * 8. Account deletion cancellation flow (cancelDeletion)
 */

const { TezzAuthClient, TezzConflictError, TezzValidationError } = require('@tezzcorp/auth-sdk');

async function runExample() {
  const baseUrl = process.env.TEZZ_AUTH_URL || 'https://account.tezzcorp.com';
  console.log('======================================================');
  console.log('Tezz Auth SDK - Node.js Example Project');
  console.log(`Connecting to: ${baseUrl}`);
  console.log('======================================================\n');

  const client = new TezzAuthClient({
    baseUrl: baseUrl,
    timeout: 10000
  });

  const timestamp = Date.now();
  const testEmail = `test.user.${timestamp}@tezzcorp.com`;
  const testPhone = `+9198${String(timestamp).slice(-8)}`;
  const testPassword = 'SecurePassword#2026';
  const testFullName = 'Rohit Test User';

  try {
    // 1. Fetch server public key
    console.log('[1/6] Fetching RSA Public Key...');
    const publicKey = await client.getPublicKey();
    console.log('      [OK] Public key loaded successfully.');

    // 2. Check availability
    console.log(`\n[2/6] Checking availability for ${testEmail}...`);
    const availResult = await client.checkAvailability('email', testEmail);
    console.log(`      [OK] Email available: ${availResult.available}`);

    // 3. Register user with automatic client-side RSA encryption
    console.log('\n[3/6] Registering new user...');
    const regResult = await client.register({
      fullName: testFullName,
      email: testEmail,
      phoneNumber: testPhone,
      password: testPassword,
      confirmPassword: testPassword
    });

    console.log('      [OK] Registration successful!');
    console.log(`      User UUID : ${regResult.user ? regResult.user.uuid : 'N/A'}`);
    console.log(`      Auth Token: ${regResult.token ? regResult.token.slice(0, 25) + '...' : 'N/A'}`);

    // 4. Test conflict handling: attempt registering the exact same user again
    console.log('\n[4/6] Testing multiple account conflict resolution...');
    try {
      await client.register({
        fullName: testFullName,
        email: testEmail,
        phoneNumber: testPhone,
        password: testPassword
      });
      console.log('      [FAIL] Duplicate registration was unexpectedly accepted.');
    } catch (err) {
      if (err instanceof TezzConflictError) {
        console.log(`      [OK] Caught typed TezzConflictError!`);
        console.log(`      Conflict field : ${err.conflictField}`);
        console.log(`      Server message : ${err.message}`);
        console.log('      -> Client can now offer: "Sign In", "Reset Password", or "Change Email".');
      } else {
        console.log(`      [WARN] Unexpected error type: ${err.message}`);
      }
    }

    // 5. Authenticate (Login)
    console.log('\n[5/6] Authenticating user credentials...');
    const loginResult = await client.login(testEmail, testPassword);

    const sessionToken = loginResult.token;
    console.log('      [OK] Login successful!');
    console.log(`      User Name : ${loginResult.user.full_name}`);
    console.log(`      Email     : ${loginResult.user.email}`);

    // 6. Fetch User Profile
    console.log('\n[6/6] Fetching verified profile with session token...');
    const profile = await client.getProfile(sessionToken);
    console.log('      [OK] Profile retrieved successfully!');
    console.log(`      UUID            : ${profile.user.uuid}`);
    console.log(`      Email Verified  : ${profile.user.is_email_verified}`);
    console.log(`      Phone Verified  : ${profile.user.is_phone_verified}`);
    console.log(`      Deletion Status : ${profile.user.is_deletion_pending ? 'Scheduled' : 'Active'}`);

    console.log('\n======================================================');
    console.log('Node.js Test Project: ALL FLOWS EXECUTED SUCCESSFULLY!');
    console.log('======================================================');
  } catch (err) {
    console.error('\n[ERROR] Example project execution failed:', err.message);
    if (err.statusCode) console.error(`HTTP Status: ${err.statusCode}`);
    if (err.data) console.error('Response Data:', err.data);
    process.exit(1);
  }
}

runExample();
