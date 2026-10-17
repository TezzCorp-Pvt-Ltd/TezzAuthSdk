package com.tezzcorp.auth.exception;

public class TezzConflictException extends TezzAuthException {
    private final String conflictField;

    public TezzConflictException(String message, String conflictField, String responseBody) {
        super(message, 409, responseBody);
        this.conflictField = conflictField != null ? conflictField : "account";
    }

    public String getConflictField() {
        return conflictField;
    }
}
