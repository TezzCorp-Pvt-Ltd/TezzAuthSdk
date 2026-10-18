# Tezz Auth - Android Example App

This is a standalone Android test project demonstrating how to integrate and use the `com.tezz.auth.android:auth-sdk-android` library in modern Android applications.

---

## Features Demonstrated
1. **Asynchronous Execution & UI Main-Thread Delivery**: Calls run asynchronously on background worker pools with completion callbacks dispatched directly onto the Android UI main thread.
2. **Client-Side RSA-OAEP Encryption**: Passwords encrypted using server public key before sending over the wire.
3. **Availability Checking**: `authClient.checkAvailability("email", email, callback)`.
4. **Registration**: `authClient.register(...)` with typed `TezzConflictException` handling.
5. **Login**: `authClient.login(...)`.
6. **Profile Retrieval**: `authClient.getProfile(...)`.

---

## Prerequisites
- Android Studio Iguana / Jellyfish or newer
- Android SDK Platform 34 (API 34)
- JDK 17

---

## Build and Run

### In Android Studio
1. Open Android Studio.
2. Select **Open** and choose `sdk/examples/android`.
3. Allow Gradle to sync.
4. Select your connected device or Android Virtual Device (AVD).
5. Click **Run 'app'**.

### From Command Line (Gradle)
```bash
cd sdk/examples/android
./gradlew assembleDebug
```
