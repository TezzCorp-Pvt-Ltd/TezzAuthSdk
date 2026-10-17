/**
 * Tezz Authentication Client (Pure JavaScript)
 */

const { rsaEncrypt } = require('./crypto');
const { TezzAuthError, TezzRateLimitError, TezzValidationError, TezzConflictError } = require('./errors');

class TezzAuthClient {
  /**
   * @param {Object} [options]
   * @param {string} [options.baseUrl='https://account.tezzcorp.com'] - API server URL
   * @param {number} [options.timeout=10000] - Timeout in milliseconds
   * @param {number} [options.keyCacheTtl=3600000] - Public key cache TTL (default 1 hr)
   */
  constructor(options = {}) {
    this.baseUrl = (options.baseUrl || 'https://account.tezzcorp.com').replace(/\/$/, '');
    this.timeout = options.timeout || 10000;
    this.keyCacheTtl = options.keyCacheTtl || 3600000;

    /** @type {string|null} */
    this._cachedPublicKey = null;
    /** @type {number} */
    this._keyExpiresAt = 0;
  }

  /**
   * Fetch and cache the server's RSA public key
   * @returns {Promise<string>} PEM public key
   */
  async getPublicKey() {
    const now = Date.now();
    if (this._cachedPublicKey && now < this._keyExpiresAt) {
      return this._cachedPublicKey;
    }

    const res = await this._rawRequest('/api/v1/auth/public-key', { method: 'GET' });
    if (!res.public_key) {
      throw new TezzAuthError('Invalid response from public-key endpoint', 500, res);
    }

    this._cachedPublicKey = res.public_key;
    this._keyExpiresAt = now + this.keyCacheTtl;
    return this._cachedPublicKey;
  }

  /**
   * Register a new user
   * Passwords are automatically encrypted with the server RSA public key.
   * @param {Object} input
   * @param {string} input.fullName
   * @param {string} input.email
   * @param {string} input.phoneNumber
   * @param {string} input.password
   * @param {string} [input.confirmPassword]
   * @returns {Promise<{success: boolean, message: string, token: string, user: Object}>}
   */
  async register(input) {
    const pubKey = await this.getPublicKey();
    const password = input.password;
    const confirmPassword = input.confirmPassword || input.password;

    const passwordEncrypted = rsaEncrypt(pubKey, password);
    const confirmPasswordEncrypted = rsaEncrypt(pubKey, confirmPassword);

    return this._request('/api/v1/auth/register', {
      method: 'POST',
      body: {
        full_name: input.fullName,
        email: input.email,
        phone_number: input.phoneNumber,
        password_encrypted: passwordEncrypted,
        confirm_password_encrypted: confirmPasswordEncrypted,
      },
    });
  }

  /**
   * Live availability check for email or phone number
   * @param {string} type - 'email' or 'phone'
   * @param {string} value - String value to check
   * @returns {Promise<{success: boolean, available: boolean}>}
   */
  async checkAvailability(type, value) {
    return this._request('/api/v1/auth/check-availability', {
      method: 'POST',
      body: { type, value },
    });
  }

  /**
   * Authenticate user credentials
   * Password is automatically RSA encrypted before transmission.
   * @param {string} identifier - Email or phone number
   * @param {string} password - User password
   * @returns {Promise<{success: boolean, message: string, token: string, user: Object}>}
   */
  async login(identifier, password) {
    const pubKey = await this.getPublicKey();
    const passwordEncrypted = rsaEncrypt(pubKey, password);

    return this._request('/api/v1/auth/login', {
      method: 'POST',
      body: {
        identifier,
        password_encrypted: passwordEncrypted,
      },
    });
  }

  /**
   * Initiate password recovery
   * @param {string} identifier - Email or phone number
   * @param {'email'|'phone'} channel - Preferred OTP delivery channel
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async forgotPassword(identifier, channel) {
    return this._request('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: { identifier, channel },
    });
  }

  /**
   * Complete password reset with OTP
   * @param {Object} input
   * @param {string} input.identifier
   * @param {'email'|'phone'} input.channel
   * @param {string} input.otpCode
   * @param {string} input.newPassword
   * @param {string} [input.confirmNewPassword]
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async resetPassword(input) {
    const pubKey = await this.getPublicKey();
    const newPassword = input.newPassword;
    const confirmNewPassword = input.confirmNewPassword || input.newPassword;

    const newPasswordEncrypted = rsaEncrypt(pubKey, newPassword);
    const confirmNewPasswordEncrypted = rsaEncrypt(pubKey, confirmNewPassword);

    return this._request('/api/v1/auth/reset-password', {
      method: 'POST',
      body: {
        identifier: input.identifier,
        channel: input.channel,
        otp_code: input.otpCode,
        new_password_encrypted: newPasswordEncrypted,
        confirm_new_password_encrypted: confirmNewPasswordEncrypted,
      },
    });
  }

  /**
   * @private
   */
  async _request(endpoint, { method, body }) {
    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 429) {
          throw new TezzRateLimitError(
            data.message || 'Rate limit exceeded',
            data.remaining_attempts || 0,
            data.lockout_seconds || 0,
            data
          );
        }
        if (response.status === 409) {
          throw new TezzConflictError(
            data.message || 'Account already registered',
            data.conflict_field || 'account',
            data
          );
        }
        if (response.status === 422) {
          throw new TezzValidationError(
            data.message || 'Validation failed',
            data.errors || [],
            data
          );
        }
        throw new TezzAuthError(
          data.message || `Request failed with HTTP ${response.status}`,
          response.status,
          data
        );
      }

      return data;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof TezzAuthError) throw err;
      if (err.name === 'AbortError') {
        throw new TezzAuthError(`Request timed out after ${this.timeout}ms`, 408);
      }
      throw new TezzAuthError(err.message, 500);
    }
  }

  /**
   * @private
   */
  async _rawRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const res = await fetch(url, options);
    if (!res.ok) {
      throw new TezzAuthError(`HTTP ${res.status}`, res.status);
    }
    return res.json();
  }
}

module.exports = {
  TezzAuthClient,
};
