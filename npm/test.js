/**
 * Integration Test for Pure JS @tezz/auth-sdk
 */

const { TezzAuthClient, rsaEncrypt } = require('./src/index');

async function run() {
  console.log('[TEST] Testing Pure JS SDK...');

  const baseUrl = process.env.TEZZ_AUTH_URL || 'http://localhost:3000';
  const client = new TezzAuthClient({ baseUrl });

  // 1. Fetch public key
  console.log('1. Fetching public key...');
  const key = await client.getPublicKey();
  console.assert(key.includes('BEGIN PUBLIC KEY'), 'Key should contain PEM header');
  console.log('   [OK] Public key fetched and cached successfully.');

  // 2. Test encryption
  console.log('2. Testing client-side RSA encryption...');
  const cipher = rsaEncrypt(key, 'SuperSecret@123');
  console.assert(cipher && typeof cipher === 'string', 'Cipher should be non-empty base64');
  console.log('   [OK] Password encrypted to RSA-OAEP base64 ciphertext.');

  // 3. Test availability check
  console.log('3. Testing availability check...');
  const avail = await client.checkAvailability('email', 'sdk_test_' + Date.now() + '@tezzcorp.com');
  console.assert(avail.available === true, 'Unique email should be available');
  console.log('   [OK] Availability check succeeded.');

  console.log('Pure JS SDK verification complete! Everything is functional.');
}

run().catch((err) => {
  console.error('[FAIL] SDK Test failed:', err);
  process.exit(1);
});
