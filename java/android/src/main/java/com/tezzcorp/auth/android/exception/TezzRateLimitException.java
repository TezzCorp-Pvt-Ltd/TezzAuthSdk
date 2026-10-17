package com.tezzcorp.auth.android.exception;

public class TezzRateLimitException extends TezzAuthException {
    private final int remainingAttempts;
    private final int lockoutSeconds;

    public TezzRateLimitException(String message, int remainingAttempts, int lockoutSeconds) {
        super(message, 429);
        this.remainingAttempts = remainingAttempts;
        this.lockoutSeconds = lockoutSeconds;
    }

    public int getRemainingAttempts() { return remainingAttempts; }
    public int getLockoutSeconds() { return lockoutSeconds; }
}
