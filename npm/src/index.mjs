/**
 * @tezz/auth-sdk - ESM Entry Point
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const { TezzAuthClient } = require('./client');
const { rsaEncrypt } = require('./crypto');
const { TezzAuthError, TezzRateLimitError, TezzValidationError, TezzConflictError } = require('./errors');

export {
  TezzAuthClient,
  rsaEncrypt,
  TezzAuthError,
  TezzRateLimitError,
  TezzValidationError,
  TezzConflictError,
};

export default TezzAuthClient;
