package com.tezz.auth.model;

import org.json.JSONObject;

public class AuthResponse {
    private final boolean success;
    private final String message;
    private final String token;
    private final TezzUser user;
    private final Boolean available;
    private final Integer remainingAttempts;
    private final Integer lockoutSeconds;

    public AuthResponse(boolean success, String message, String token, TezzUser user, Boolean available, Integer remainingAttempts, Integer lockoutSeconds) {
        this.success = success;
        this.message = message;
        this.token = token;
        this.user = user;
        this.available = available;
        this.remainingAttempts = remainingAttempts;
        this.lockoutSeconds = lockoutSeconds;
    }

    public static AuthResponse fromJson(JSONObject json) {
        TezzUser user = null;
        if (json.has("user") && !json.isNull("user")) {
            user = TezzUser.fromJson(json.getJSONObject("user"));
        }

        Boolean available = json.has("available") ? json.getBoolean("available") : null;
        Integer remainingAttempts = json.has("remaining_attempts") ? json.getInt("remaining_attempts") : null;
        Integer lockoutSeconds = json.has("lockout_seconds") ? json.getInt("lockout_seconds") : null;

        return new AuthResponse(
            json.optBoolean("success", false),
            json.optString("message", null),
            json.optString("token", null),
            user,
            available,
            remainingAttempts,
            lockoutSeconds
        );
    }

    public boolean isSuccess() { return success; }
    public String getMessage() { return message; }
    public String getToken() { return token; }
    public TezzUser getUser() { return user; }
    public Boolean getAvailable() { return available; }
    public Integer getRemainingAttempts() { return remainingAttempts; }
    public Integer getLockoutSeconds() { return lockoutSeconds; }
}
