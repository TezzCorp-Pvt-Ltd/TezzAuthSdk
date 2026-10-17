package com.tezzcorp.auth.model;

import org.json.JSONObject;

public class TezzUser {
    private final String uuid;
    private final String fullName;
    private final String email;
    private final String phoneNumber;
    private final boolean isEmailVerified;
    private final boolean isPhoneVerified;

    public TezzUser(String uuid, String fullName, String email, String phoneNumber, boolean isEmailVerified, boolean isPhoneVerified) {
        this.uuid = uuid;
        this.fullName = fullName;
        this.email = email;
        this.phoneNumber = phoneNumber;
        this.isEmailVerified = isEmailVerified;
        this.isPhoneVerified = isPhoneVerified;
    }

    public static TezzUser fromJson(JSONObject json) {
        return new TezzUser(
            json.optString("uuid", ""),
            json.optString("full_name", ""),
            json.optString("email", ""),
            json.optString("phone_number", ""),
            json.optBoolean("is_email_verified", false),
            json.optBoolean("is_phone_verified", false)
        );
    }

    public String getUuid() { return uuid; }
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
    public String getPhoneNumber() { return phoneNumber; }
    public boolean isEmailVerified() { return isEmailVerified; }
    public boolean isPhoneVerified() { return isPhoneVerified; }
}
