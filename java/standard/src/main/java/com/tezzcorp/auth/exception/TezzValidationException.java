package com.tezzcorp.auth.exception;

public class TezzValidationException extends TezzAuthException {
    public TezzValidationException(String message, String responseBody) {
        super(message, 422, responseBody);
    }
}
