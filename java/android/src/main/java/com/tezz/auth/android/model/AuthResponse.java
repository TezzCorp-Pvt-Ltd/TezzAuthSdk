package com.tezz.auth.android.model;

import com.google.gson.annotations.SerializedName;

public class AuthResponse {
    @SerializedName("success")
    private boolean success;

    @SerializedName("message")
    private String message;

    @SerializedName("token")
    private String token;

    @SerializedName("user")
    private TezzUser user;

    @SerializedName("available")
    private Boolean available;

    @SerializedName("remaining_attempts")
    private Integer remainingAttempts;

    @SerializedName("lockout_seconds")
    private Integer lockoutSeconds;

    public boolean isSuccess() { return success; }
    public String getMessage() { return message; }
    public String getToken() { return token; }
    public TezzUser getUser() { return user; }
    public Boolean getAvailable() { return available; }
    public Integer getRemainingAttempts() { return remainingAttempts; }
    public Integer getLockoutSeconds() { return lockoutSeconds; }
}
