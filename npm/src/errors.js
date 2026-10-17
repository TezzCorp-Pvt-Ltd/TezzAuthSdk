/**
 * @tezzcorp/auth-sdk Custom Errors
 */

class TezzAuthError extends Error {
  /**
   * @param {string} message
   * @param {number} statusCode
   * @param {any} [response]
   */
  constructor(message, statusCode, response = null) {
    super(message);
    this.name = 'TezzAuthError';
    this.statusCode = statusCode;
    this.response = response;
  }
}

class TezzRateLimitError extends TezzAuthError {
  /**
   * @param {string} message
   * @param {number} remainingAttempts
   * @param {number} lockoutSeconds
   * @param {any} [response]
   */
  constructor(message, remainingAttempts, lockoutSeconds, response = null) {
    super(message, 429, response);
    this.name = 'TezzRateLimitError';
    this.remainingAttempts = remainingAttempts;
    this.lockoutSeconds = lockoutSeconds;
  }
}

class TezzValidationError extends TezzAuthError {
  /**
   * @param {string} message
   * @param {Array<{msg: string, path: string}>} errors
   * @param {any} [response]
   */
  constructor(message, errors = [], response = null) {
    super(message, 422, response);
    this.name = 'TezzValidationError';
    this.errors = errors;
  }
}

class TezzConflictError extends TezzAuthError {
  /**
   * @param {string} message
   * @param {'email'|'phone'|'both'|string} conflictField
   * @param {any} [response]
   */
  constructor(message, conflictField = 'account', response = null) {
    super(message, 409, response);
    this.name = 'TezzConflictError';
    this.conflictField = conflictField;
  }
}

module.exports = {
  TezzAuthError,
  TezzRateLimitError,
  TezzValidationError,
  TezzConflictError,
};
