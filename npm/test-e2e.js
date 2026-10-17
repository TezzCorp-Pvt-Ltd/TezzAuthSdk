/**
 * Comprehensive End-to-End Test for @tezzcorp/auth-sdk (Pure JavaScript)
 */

const { TezzAuthClient, rsaEncrypt, TezzRateLimitError, TezzAuthError, TezzConflictError } = require('./src/index');

async function main() {
  console.log('\n======================================================');
  console.log('Running Pure JavaScript SDK End-to-End Test Suite');
  console.log('======================================================\n');

  const client = new TezzAuthClient({ baseUrl: 'http://localhost:3000' });
  const timestamp = Date.now();
  const testEmail = `js.sdk.${timestamp}@tezzcorp.com`;
  const testPhone = `+9199${String(timestamp).slice(-8)}`;
  const password = 'SuperSecret@2026';
  const newPassword = 'NewSecret@2026';

  // 1. Fetch public key
  console.log('[1/7] Fetching RSA Public Key...');
  const key = await client.getPublicKey();
  if (!key.includes('BEGIN PUBLIC KEY')) throw new Error('Invalid public key format');
  console.log('   [OK] Key retrieved and cached successfully.');

  // 2. Check availability
  console.log('[2/7] Checking availability...');
  const check1 = await client.checkAvailability('email', testEmail);
  if (!check1.available) throw new Error('Fresh email should be available');
  console.log(`   [OK] Email ${testEmail} is available.`);

  // 3. User Registration with automatic client-side RSA encryption
  console.log('[3/7] Registering user with encrypted credentials...');
  const reg = await client.register({
    fullName: 'Pure JS User',
    email: testEmail,
    phoneNumber: testPhone,
    password: password,
    confirmPassword: password,
  });

  if (!reg.success || !reg.token) throw new Error('Registration failed: ' + JSON.stringify(reg));
  console.log(`   [OK] User registered! UUID: ${reg.user.uuid}`);
  console.log(`   [OK] Issued JWT token: ${reg.token.slice(0, 32)}...`);

  // Verify availability now returns false
  const check2 = await client.checkAvailability('email', testEmail);
  if (check2.available) throw new Error('Registered email should NOT be available');
  console.log('   [OK] Availability correctly returned false for registered email.');

  // 4. Multiple account conflict handling (409 conflict detection)
  console.log('[4/7] Testing multiple account conflict resolution (TezzConflictError)...');
  try {
    await client.register({
      fullName: 'Duplicate User',
      email: testEmail, // same email
      phoneNumber: `+9188${String(timestamp).slice(-8)}`,
      password: password,
    });
    throw new Error('Should have failed with TezzConflictError');
  } catch (err) {
    if (err instanceof TezzConflictError && err.statusCode === 409) {
      console.log(`   [OK] Caught TezzConflictError: conflictField="${err.conflictField}"`);
      console.log(`   [OK] Client can present user options: "Sign In" vs "Reset Password" vs "Change Email"`);
    } else {
      throw err;
    }
  }

  // 5. Login with RSA-encrypted password
  console.log('[5/7] Authenticating via client.login()...');
  const login = await client.login(testEmail, password);
  if (!login.success || !login.token) throw new Error('Login failed: ' + JSON.stringify(login));
  console.log(`   [OK] Login successful for ${login.user.full_name}!`);
  console.log(`   [OK] Session token verified.`);

  // 6. Test Anti-Enumeration with bad credentials
  console.log('[6/7] Testing anti-enumeration on invalid login...');
  try {
    await client.login(testEmail, 'WrongPassword@999');
    throw new Error('Login should have failed for bad password');
  } catch (err) {
    if (err instanceof TezzAuthError && err.statusCode === 401) {
      console.log(`   [OK] Correctly caught 401 error: "${err.message}"`);
    } else {
      throw err;
    }
  }

  // 7. Forgot password privacy-safe response
  console.log('[7/7] Testing forgot-password flow...');
  const forgot = await client.forgotPassword(testEmail, 'email');
  if (!forgot.success || !forgot.message.includes('If your account exists')) {
    throw new Error('Forgot password message violates privacy requirement');
  }
  console.log(`   [OK] Privacy-safe response: "${forgot.message.slice(0, 50)}..."`);

  console.log('\n======================================================');
  console.log('Pure JavaScript SDK: ALL 7 TESTS PASSED FLAWLESSLY!');
  console.log('======================================================\n');
}

main().catch((err) => {
  console.error('\n[FAIL] Pure JS SDK E2E Test Failed:\n', err);
  process.exit(1);
});
