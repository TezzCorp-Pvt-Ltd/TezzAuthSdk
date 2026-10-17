package com.tezz.auth.exception;

public class TezzRateLimitException extends TezzAuthException {
    private final int remainingAttempts;
    private final int lockoutSeconds;

    public TezzRateLimitException(String message, int remainingAttempts, int lockoutSeconds, String responseBody) {
        super(message, 429, responseBody);
        this.remainingAttempts = remainingAttempts;
        this.lockoutSeconds = lockoutSeconds;
    }

    public int getRemainingAttempts() {
        return remainingAttempts;
    }

    public int getLockoutSeconds() {
        return lockoutSeconds;
    }
}
