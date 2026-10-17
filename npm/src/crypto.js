/**
 * Pure JavaScript RSA-OAEP Encryption using Node.js built-in crypto module
 */

const crypto = require('crypto');

/**
 * Encrypt plaintext string using RSA-OAEP with SHA-256
 * @param {string} publicKeyPem - RSA public key in PEM format
 * @param {string} plaintext - Plain text to encrypt
 * @returns {string} Base64 encoded ciphertext
 */
function rsaEncrypt(publicKeyPem, plaintext) {
  const buffer = Buffer.from(plaintext, 'utf8');
  const encrypted = crypto.publicEncrypt(
    {
      key: publicKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    buffer
  );
  return encrypted.toString('base64');
}

module.exports = {
  rsaEncrypt,
};
