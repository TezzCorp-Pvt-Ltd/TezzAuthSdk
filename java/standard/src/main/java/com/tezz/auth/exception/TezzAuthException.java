package com.tezz.auth.exception;

public class TezzAuthException extends Exception {
    private final int statusCode;
    private final String responseBody;

    public TezzAuthException(String message) {
        this(message, 500, null);
    }

    public TezzAuthException(String message, int statusCode, String responseBody) {
        super(message);
        this.statusCode = statusCode;
        this.responseBody = responseBody;
    }

    public int getStatusCode() {
        return statusCode;
    }

    public String getResponseBody() {
        return responseBody;
    }
}
