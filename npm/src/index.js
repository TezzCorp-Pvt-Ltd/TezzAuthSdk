/**
 * @tezz/auth-sdk - CommonJS Entry Point
 */

const { TezzAuthClient } = require('./client');
const { rsaEncrypt } = require('./crypto');
const { TezzAuthError, TezzRateLimitError, TezzValidationError, TezzConflictError } = require('./errors');

module.exports = {
  TezzAuthClient,
  rsaEncrypt,
  TezzAuthError,
  TezzRateLimitError,
  TezzValidationError,
  TezzConflictError,
  default: TezzAuthClient,
};
