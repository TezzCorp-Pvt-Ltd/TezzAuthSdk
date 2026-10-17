/**
 * TypeScript Type Definitions for @tezz/auth-sdk
 */

export interface TezzClientOptions {
  baseUrl?: string;
  timeout?: number;
  keyCacheTtl?: number;
}

export interface TezzUser {
  uuid: string;
  full_name: string;
  email: string;
  phone_number: string;
  is_email_verified: boolean;
  is_phone_verified: boolean;
}

export interface RegisterInput {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword?: string;
}

export interface ResetPasswordInput {
  identifier: string;
  channel: 'email' | 'phone';
  otpCode: string;
  newPassword: string;
  confirmNewPassword?: string;
}

export interface AuthSuccessResponse {
  success: boolean;
  message: string;
  token: string;
  user: TezzUser;
  remaining_attempts?: number;
  lockout_seconds?: number;
}

export interface AvailabilityResponse {
  success: boolean;
  available: boolean;
  source?: 'cache' | 'db';
}

export interface SimpleMessageResponse {
  success: boolean;
  message: string;
}

export class TezzAuthError extends Error {
  statusCode: number;
  response: any;
  constructor(message: string, statusCode: number, response?: any);
}

export class TezzRateLimitError extends TezzAuthError {
  remainingAttempts: number;
  lockoutSeconds: number;
  constructor(message: string, remainingAttempts: number, lockoutSeconds: number, response?: any);
}

export class TezzValidationError extends TezzAuthError {
  errors: Array<{ msg: string; path: string }>;
  constructor(message: string, errors?: Array<{ msg: string; path: string }>, response?: any);
}

export class TezzConflictError extends TezzAuthError {
  conflictField: 'email' | 'phone' | 'both' | string;
  constructor(message: string, conflictField?: string, response?: any);
}

export class TezzAuthClient {
  constructor(options?: TezzClientOptions);
  getPublicKey(): Promise<string>;
  register(input: RegisterInput): Promise<AuthSuccessResponse>;
  checkAvailability(type: 'email' | 'phone', value: string): Promise<AvailabilityResponse>;
  login(identifier: string, password: string): Promise<AuthSuccessResponse>;
  forgotPassword(identifier: string, channel: 'email' | 'phone'): Promise<SimpleMessageResponse>;
  resetPassword(input: ResetPasswordInput): Promise<SimpleMessageResponse>;
}

export function rsaEncrypt(publicKeyPem: string, plaintext: string): string;

export default TezzAuthClient;
