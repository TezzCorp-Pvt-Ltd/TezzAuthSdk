# Tezz Auth - Java Standard Example Project

This is a standalone Maven test project demonstrating how to integrate and use the `com.tezz:auth-sdk` client package in standard Java applications (Spring Boot, Quarkus, Micronaut, Dropwizard, or backend microservices).

---

## Prerequisites
- Java 11 or higher (`java -version`)
- Apache Maven (`mvn -version`)

---

## Build and Run

### Against Production (`https://account.tezzcorp.com`)
```bash
cd sdk/examples/java-standard
mvn clean compile exec:java
```

### Against Local Dev Server (`http://localhost:3000`)
```bash
# Windows PowerShell
$env:TEZZ_AUTH_URL="http://localhost:3000"; mvn clean compile exec:java

# Linux / macOS
TEZZ_AUTH_URL="http://localhost:3000" mvn clean compile exec:java
```

---

## What This Example Demonstrates
1. Initializing `TezzAuthClient` with timeouts and rolling key caching
2. Checking credential availability via `checkAvailability(type, value)`
3. Client-side RSA-OAEP password encryption during `register(...)`
4. Handling `TezzConflictException` with typed `getConflictField()`
5. Authenticating user via `login(identifier, password)`
6. Fetching verified profile with JWT session token via `getProfile(token)`
