package com.tezz.auth;

import com.tezz.auth.exception.TezzAuthException;
import com.tezz.auth.exception.TezzConflictException;
import com.tezz.auth.exception.TezzRateLimitException;
import com.tezz.auth.exception.TezzValidationException;
import com.tezz.auth.model.AuthResponse;
import org.json.JSONObject;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

public class TezzAuthClient {
    private final String baseUrl;
    private final HttpClient httpClient;
    private final Duration timeout;

    private String cachedPublicKey;
    private long keyExpiresAt = 0;
    private final long keyTtlMs = 3600000; // 1 hour

    public TezzAuthClient(String baseUrl) {
        this(baseUrl, Duration.ofSeconds(10));
    }

    public TezzAuthClient(String baseUrl, Duration timeout) {
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        this.timeout = timeout;
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(timeout)
            .build();
    }

    public synchronized String getPublicKey() throws TezzAuthException {
        long now = System.currentTimeMillis();
        if (cachedPublicKey != null && now < keyExpiresAt) {
            return cachedPublicKey;
        }

        try {
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/api/v1/auth/public-key"))
                .timeout(timeout)
                .GET()
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            JSONObject json = new JSONObject(response.body());

            if (!json.has("public_key")) {
                throw new TezzAuthException("Missing public key in response", response.statusCode(), response.body());
            }

            cachedPublicKey = json.getString("public_key");
            keyExpiresAt = now + keyTtlMs;
            return cachedPublicKey;
        } catch (Exception e) {
            if (e instanceof TezzAuthException) throw (TezzAuthException) e;
            throw new TezzAuthException("Failed to fetch public key: " + e.getMessage());
        }
    }

    public AuthResponse register(String fullName, String email, String phoneNumber, String password) throws TezzAuthException {
        return register(fullName, email, phoneNumber, password, password);
    }

    public AuthResponse register(String fullName, String email, String phoneNumber, String password, String confirmPassword) throws TezzAuthException {
        String pubKey = getPublicKey();
        String passEnc = TezzCrypto.encrypt(pubKey, password);
        String confEnc = TezzCrypto.encrypt(pubKey, confirmPassword != null ? confirmPassword : password);

        JSONObject body = new JSONObject();
        body.put("full_name", fullName);
        body.put("email", email);
        body.put("phone_number", phoneNumber);
        body.put("password_encrypted", passEnc);
        body.put("confirm_password_encrypted", confEnc);

        return sendPost("/api/v1/auth/register", body);
    }

    public boolean checkAvailability(String type, String value) throws TezzAuthException {
        JSONObject body = new JSONObject();
        body.put("type", type);
        body.put("value", value);

        AuthResponse res = sendPost("/api/v1/auth/check-availability", body);
        return Boolean.TRUE.equals(res.getAvailable());
    }

    public AuthResponse login(String identifier, String password) throws TezzAuthException {
        String pubKey = getPublicKey();
        String passEnc = TezzCrypto.encrypt(pubKey, password);

        JSONObject body = new JSONObject();
        body.put("identifier", identifier);
        body.put("password_encrypted", passEnc);

        return sendPost("/api/v1/auth/login", body);
    }

    public AuthResponse forgotPassword(String identifier, String channel) throws TezzAuthException {
        JSONObject body = new JSONObject();
        body.put("identifier", identifier);
        body.put("channel", channel);

        return sendPost("/api/v1/auth/forgot-password", body);
    }

    public AuthResponse resetPassword(String identifier, String channel, String otpCode, String newPassword, String confirmNewPassword) throws TezzAuthException {
        String pubKey = getPublicKey();
        String passEnc = TezzCrypto.encrypt(pubKey, newPassword);
        String confEnc = TezzCrypto.encrypt(pubKey, confirmNewPassword != null ? confirmNewPassword : newPassword);

        JSONObject body = new JSONObject();
        body.put("identifier", identifier);
        body.put("channel", channel);
        body.put("otp_code", otpCode);
        body.put("new_password_encrypted", passEnc);
        body.put("confirm_new_password_encrypted", confEnc);

        return sendPost("/api/v1/auth/reset-password", body);
    }

    private AuthResponse sendPost(String endpoint, JSONObject body) throws TezzAuthException {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + endpoint))
                .header("Content-Type", "application/json")
                .timeout(timeout)
                .POST(HttpRequest.BodyPublishers.ofString(body.toString()))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            String responseBody = response.body();
            JSONObject json = new JSONObject(responseBody != null && !responseBody.isEmpty() ? responseBody : "{}");

            if (response.statusCode() >= 400) {
                if (response.statusCode() == 429) {
                    throw new TezzRateLimitException(
                        json.optString("message", "Rate limit exceeded"),
                        json.optInt("remaining_attempts", 0),
                        json.optInt("lockout_seconds", 0),
                        responseBody
                    );
                }
                if (response.statusCode() == 409) {
                    throw new TezzConflictException(
                        json.optString("message", "Account already registered"),
                        json.optString("conflict_field", "account"),
                        responseBody
                    );
                }
                if (response.statusCode() == 422) {
                    throw new TezzValidationException(
                        json.optString("message", "Validation failed"),
                        responseBody
                    );
                }
                throw new TezzAuthException(
                    json.optString("message", "HTTP " + response.statusCode()),
                    response.statusCode(),
                    responseBody
                );
            }

            return AuthResponse.fromJson(json);
        } catch (Exception e) {
            if (e instanceof TezzAuthException) throw (TezzAuthException) e;
            throw new TezzAuthException("Request failed: " + e.getMessage());
        }
    }
}
