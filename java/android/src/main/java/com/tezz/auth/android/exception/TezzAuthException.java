package com.tezz.auth.android.exception;

public class TezzAuthException extends Exception {
    private final int statusCode;

    public TezzAuthException(String message) {
        this(message, 500);
    }

    public TezzAuthException(String message, int statusCode) {
        super(message);
        this.statusCode = statusCode;
    }

    public int getStatusCode() {
        return statusCode;
    }
}
