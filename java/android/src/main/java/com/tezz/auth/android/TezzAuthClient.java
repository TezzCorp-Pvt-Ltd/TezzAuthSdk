package com.tezz.auth.android;

import android.os.Handler;
import android.os.Looper;
import com.google.gson.Gson;
import com.tezz.auth.android.exception.TezzAuthException;
import com.tezz.auth.android.exception.TezzConflictException;
import com.tezz.auth.android.exception.TezzRateLimitException;
import com.tezz.auth.android.model.AuthResponse;
import okhttp3.*;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

public class TezzAuthClient {
    public static final String DEFAULT_BASE_URL = "https://account.tezzcorp.com";

    private final String baseUrl;
    private final OkHttpClient okHttpClient;
    private final Gson gson;
    private final ExecutorService executor;
    private final Handler mainHandler;

    private String cachedPublicKey;
    private long keyExpiresAt = 0;
    private final long keyTtlMs = 3600000; // 1 hour

    public TezzAuthClient() {
        this(DEFAULT_BASE_URL);
    }

    public TezzAuthClient(String baseUrl) {
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        this.okHttpClient = new OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(15, TimeUnit.SECONDS)
            .build();
        this.gson = new Gson();
        this.executor = Executors.newCachedThreadPool();
        this.mainHandler = new Handler(Looper.getMainLooper());
    }

    private synchronized String fetchPublicKeySync() throws TezzAuthException {
        long now = System.currentTimeMillis();
        if (cachedPublicKey != null && now < keyExpiresAt) {
            return cachedPublicKey;
        }

        Request request = new Request.Builder()
            .url(baseUrl + "/api/v1/auth/public-key")
            .get()
            .build();

        try (Response response = okHttpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new TezzAuthException("Failed to fetch public key: HTTP " + response.code(), response.code());
            }

            String body = response.body() != null ? response.body().string() : "";
            AuthResponse resp = gson.fromJson(body, AuthResponse.class);

            // Fetch public_key string directly from json
            Map<String, Object> map = gson.fromJson(body, Map.class);
            String pubKey = (String) map.get("public_key");

            if (pubKey == null) {
                throw new TezzAuthException("Missing public key in server response");
            }

            cachedPublicKey = pubKey;
            keyExpiresAt = now + keyTtlMs;
            return cachedPublicKey;
        } catch (IOException e) {
            throw new TezzAuthException("Network error while fetching public key: " + e.getMessage());
        }
    }

    public void register(
        String fullName,
        String email,
        String phoneNumber,
        String password,
        TezzCallback<AuthResponse> callback
    ) {
        register(fullName, email, phoneNumber, password, password, callback);
    }

    public void register(
        String fullName,
        String email,
        String phoneNumber,
        String password,
        String confirmPassword,
        TezzCallback<AuthResponse> callback
    ) {
        executor.execute(() -> {
            try {
                String pubKey = fetchPublicKeySync();
                String passEnc = TezzCrypto.encrypt(pubKey, password);
                String confEnc = TezzCrypto.encrypt(pubKey, confirmPassword != null ? confirmPassword : password);

                Map<String, String> body = new HashMap<>();
                body.put("full_name", fullName);
                body.put("email", email);
                body.put("phone_number", phoneNumber);
                body.put("password_encrypted", passEnc);
                body.put("confirm_password_encrypted", confEnc);

                executePost("/api/v1/auth/register", body, callback);
            } catch (TezzAuthException e) {
                postError(callback, e);
            }
        });
    }

    public void checkAvailability(String type, String value, TezzCallback<Boolean> callback) {
        executor.execute(() -> {
            try {
                Map<String, String> body = new HashMap<>();
                body.put("type", type);
                body.put("value", value);

                AuthResponse res = executePostSync("/api/v1/auth/check-availability", body);
                postSuccess(callback, Boolean.TRUE.equals(res.getAvailable()));
            } catch (TezzAuthException e) {
                postError(callback, e);
            }
        });
    }

    public void login(String identifier, String password, TezzCallback<AuthResponse> callback) {
        executor.execute(() -> {
            try {
                String pubKey = fetchPublicKeySync();
                String passEnc = TezzCrypto.encrypt(pubKey, password);

                Map<String, String> body = new HashMap<>();
                body.put("identifier", identifier);
                body.put("password_encrypted", passEnc);

                executePost("/api/v1/auth/login", body, callback);
            } catch (TezzAuthException e) {
                postError(callback, e);
            }
        });
    }

    public void forgotPassword(String identifier, String channel, TezzCallback<AuthResponse> callback) {
        executor.execute(() -> {
            Map<String, String> body = new HashMap<>();
            body.put("identifier", identifier);
            body.put("channel", channel);

            executePost("/api/v1/auth/forgot-password", body, callback);
        });
    }

    public void resetPassword(
        String identifier,
        String channel,
        String otpCode,
        String newPassword,
        String confirmNewPassword,
        TezzCallback<AuthResponse> callback
    ) {
        executor.execute(() -> {
            try {
                String pubKey = fetchPublicKeySync();
                String passEnc = TezzCrypto.encrypt(pubKey, newPassword);
                String confEnc = TezzCrypto.encrypt(pubKey, confirmNewPassword != null ? confirmNewPassword : newPassword);

                Map<String, String> body = new HashMap<>();
                body.put("identifier", identifier);
                body.put("channel", channel);
                body.put("otp_code", otpCode);
                body.put("new_password_encrypted", passEnc);
                body.put("confirm_new_password_encrypted", confEnc);

                executePost("/api/v1/auth/reset-password", body, callback);
            } catch (TezzAuthException e) {
                postError(callback, e);
            }
        });
    }

    public void getProfile(String token, TezzCallback<AuthResponse> callback) {
        executor.execute(() -> {
            Request request = new Request.Builder()
                .url(baseUrl + "/api/v1/auth/me")
                .header("Authorization", "Bearer " + token)
                .get()
                .build();

            try (Response response = okHttpClient.newCall(request).execute()) {
                String respBody = response.body() != null ? response.body().string() : "{}";
                AuthResponse authResp = gson.fromJson(respBody, AuthResponse.class);
                if (!response.isSuccessful()) {
                    throw new TezzAuthException(
                        authResp.getMessage() != null ? authResp.getMessage() : "HTTP " + response.code(),
                        response.code()
                    );
                }
                postSuccess(callback, authResp);
            } catch (Exception e) {
                postError(callback, e instanceof TezzAuthException ? (TezzAuthException) e : new TezzAuthException(e.getMessage()));
            }
        });
    }

    public void cancelDeletion(String token, TezzCallback<AuthResponse> callback) {
        executor.execute(() -> {
            RequestBody emptyBody = RequestBody.create("{}", MediaType.parse("application/json; charset=utf-8"));
            Request request = new Request.Builder()
                .url(baseUrl + "/api/v1/auth/cancel-deletion")
                .header("Authorization", "Bearer " + token)
                .post(emptyBody)
                .build();

            try (Response response = okHttpClient.newCall(request).execute()) {
                String respBody = response.body() != null ? response.body().string() : "{}";
                AuthResponse authResp = gson.fromJson(respBody, AuthResponse.class);
                if (!response.isSuccessful()) {
                    throw new TezzAuthException(
                        authResp.getMessage() != null ? authResp.getMessage() : "HTTP " + response.code(),
                        response.code()
                    );
                }
                postSuccess(callback, authResp);
            } catch (Exception e) {
                postError(callback, e instanceof TezzAuthException ? (TezzAuthException) e : new TezzAuthException(e.getMessage()));
            }
        });
    }

    private void executePost(String endpoint, Map<String, String> bodyMap, TezzCallback<AuthResponse> callback) {
        try {
            AuthResponse res = executePostSync(endpoint, bodyMap);
            postSuccess(callback, res);
        } catch (TezzAuthException e) {
            postError(callback, e);
        }
    }

    private AuthResponse executePostSync(String endpoint, Map<String, String> bodyMap) throws TezzAuthException {
        RequestBody body = RequestBody.create(
            gson.toJson(bodyMap),
            MediaType.parse("application/json; charset=utf-8")
        );

        Request request = new Request.Builder()
            .url(baseUrl + endpoint)
            .post(body)
            .build();

        try (Response response = okHttpClient.newCall(request).execute()) {
            String respBody = response.body() != null ? response.body().string() : "{}";
            AuthResponse authResp = gson.fromJson(respBody, AuthResponse.class);

            if (!response.isSuccessful()) {
                if (response.code() == 429) {
                    throw new TezzRateLimitException(
                        authResp.getMessage() != null ? authResp.getMessage() : "Rate limited",
                        authResp.getRemainingAttempts() != null ? authResp.getRemainingAttempts() : 0,
                        authResp.getLockoutSeconds() != null ? authResp.getLockoutSeconds() : 0
                    );
                }
                if (response.code() == 409) {
                    Map<String, Object> map = gson.fromJson(respBody, Map.class);
                    String field = map != null && map.containsKey("conflict_field") ? (String) map.get("conflict_field") : "account";
                    throw new TezzConflictException(
                        authResp.getMessage() != null ? authResp.getMessage() : "Account already registered",
                        field
                    );
                }
                throw new TezzAuthException(
                    authResp.getMessage() != null ? authResp.getMessage() : "HTTP " + response.code(),
                    response.code()
                );
            }

            return authResp;
        } catch (IOException e) {
            throw new TezzAuthException("Network failure: " + e.getMessage());
        }
    }

    private <T> void postSuccess(TezzCallback<T> callback, T result) {
        mainHandler.post(() -> callback.onSuccess(result));
    }

    private <T> void postError(TezzCallback<T> callback, TezzAuthException error) {
        mainHandler.post(() -> callback.onError(error));
    }
}
