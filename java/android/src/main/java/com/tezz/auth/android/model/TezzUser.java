package com.tezz.auth.android.model;

import com.google.gson.annotations.SerializedName;

public class TezzUser {
    @SerializedName("uuid")
    private String uuid;

    @SerializedName("full_name")
    private String fullName;

    @SerializedName("email")
    private String email;

    @SerializedName("phone_number")
    private String phoneNumber;

    @SerializedName("is_email_verified")
    private boolean isEmailVerified;

    @SerializedName("is_phone_verified")
    private boolean isPhoneVerified;

    public String getUuid() { return uuid; }
    public String getFullName() { return fullName; }
    public String getEmail() { return email; }
    public String getPhoneNumber() { return phoneNumber; }
    public boolean isEmailVerified() { return isEmailVerified; }
    public boolean isPhoneVerified() { return isPhoneVerified; }
}
