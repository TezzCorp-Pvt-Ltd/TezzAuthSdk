package com.tezz.auth.android.exception;

public class TezzConflictException extends TezzAuthException {
    private final String conflictField;

    public TezzConflictException(String message, String conflictField) {
        super(message, 409);
        this.conflictField = conflictField != null ? conflictField : "account";
    }

    public String getConflictField() {
        return conflictField;
    }
}
