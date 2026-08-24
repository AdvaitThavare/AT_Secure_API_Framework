# AT_Secure_API_Framework

A TypeScript-based API security testing framework for developing and validating secure API flows using HTTPS/mTLS and application-level encryption.

The project currently uses a local HTTPS echo server and Postman for interoperability and end-to-end verification.

## Current Scope

The framework currently supports:

* HTTPS with mutual TLS (mTLS / 2-way SSL)
* Centralized request preparation and header normalization
* Request routing and payload/encryption identification
* JSON and `text/plain` request parsing
* Request representation validation
* JWE
* AES_RSA
* JWS_AES_RSA
* Reusable AES and RSA cryptographic utilities
* Explicit cryptographic algorithm allowlists
* Response serialization
* Common framework error handling
* Service dispatching
* Postman interoperability testing

## Architecture at a Glance

```text
Client / Postman
       |
       | HTTPS + mTLS
       v
Request Preparation
       |
       v
Routing / Request Validation
       |
       +------ ENCRYPTED ------+
       |                       |
       |                 Decryption
       |                       |
       +-----------------------+
       |
       v
API Service
       |
       v
Response Serialization
       |
       +------ ENCRYPTED ------+
       |                       |
       |                 Encryption
       |                       |
       +-----------------------+
       |
       v
HTTP Response
```

`server.ts` acts primarily as the request/response pipeline orchestrator. Individual layers own request preparation, validation, cryptography, service processing, serialization, and HTTP response handling.

For detailed architecture and design decisions, see [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Supported Encryption

### JWE

```text
RSA-OAEP-256
      +
AES-256-GCM
```

JWE provides confidentiality and authenticated encryption through AES-GCM.

### AES_RSA

```text
Plaintext
    |
AES-256-CBC
    |
Encrypted Payload

AES Key
    |
RSA/PKCS#1 v1.5
    |
Encrypted Key
```

Current configuration:

* AES-256-CBC
* PKCS#7 padding
* 16-byte random IV
* RSA/PKCS#1 v1.5
* No signature

The IV is transported in the encrypted wrapper as a Base64-encoded `base64iv` field.

### JWS_AES_RSA

```text
Plaintext
    |
RS256 JWS
    |
Signed Plaintext
    |
AES-256-CBC
    |
Encrypted Payload

AES Key
    |
RSA/PKCS#1 v1.5
    |
Encrypted Key
```

Current configuration:

* RS256
* AES-256-CBC
* PKCS#7 padding
* 16-byte random IV
* RSA/PKCS#1 v1.5

The current JWS algorithm/type allowlist permits `RS256 + JWT`.

## Request Handling

Requests use normalized HTTP headers and a common request-validation flow.

Supported application media types are currently:

```text
application/json
text/plain
```

Request parsing uses a parser map:

```text
Content-Type
    |
    v
Media Type Normalization
    |
    v
Parser Map
    |
    +--> JSON
    |
    +--> Text
```

Encrypted requests are decrypted before reaching the common application-level parsing stage, so plain and encrypted requests ultimately converge on the same request parsing/validation flow.

## Response Handling

API services return a representation-neutral `ServiceResponse`.

Response serialization occurs outside the API service and currently supports JSON and text representations.

For encrypted responses:

```text
Content-Type
    → media type of the decrypted API payload

X-Enc-Wrapper-Content-Type
    → media type of the encrypted transport wrapper
```

Therefore an encrypted response whose decrypted API payload is `text/plain` may contain:

```text
Content-Type: text/plain
X-Enc-Wrapper-Content-Type: application/json
```

The outer response body may appear as JSON text in an HTTP client while still being correctly identified as `text/plain` by the HTTP `Content-Type`. This is an intentional separation between the API representation and encrypted transport wrapper representation.

## Setup

Install dependencies:

```bash
npm install
```

Compile the project:

```bash
npx tsc
```

Start the application using the compiled output according to the local development setup.

## Certificates

The framework uses local certificates for HTTPS/mTLS development.

Private keys and other sensitive certificate material are excluded from version control.

See:

[`certs/Certificate_Setup_Guide.md`](./certs/Certificate_Setup_Guide.md)

for certificate generation and local setup instructions.

**Never commit private keys, credentials, or other sensitive material.**

## Testing

Postman is currently used for interoperability and positive-flow verification.

The current encrypted end-to-end flows have been verified for:

* JWE
* AES_RSA
* JWS_AES_RSA

JSON encrypted flows and JSON payloads delivered with `text/plain` have been validated.

Plain-text encrypted-request scenarios for AES_RSA and JWS_AES_RSA are currently deferred because the existing Postman setup cannot conveniently generate the required plaintext encrypted requests.

An automated regression test suite is planned as part of Phase 2.

## Phase Status

```text
Phase 0 — Secure Flow Foundation      Complete
Phase 1 — Framework Architecture      Complete
Phase 2 — API Security Expansion      Planned
```

Phase 2 is expected to introduce:

* Unified URL/method validation
* Automated regression testing
* Client ID / Client Secret
* API subscription authorization
* User/customer authentication and authorization
* Realistic API services and persistence
* Multiple-client certificate identity mapping

The detailed Phase-2 direction is documented in [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Project Structure

The project is organized by responsibility, including:

```text
src/
├── context/
├── errors/
├── requestHandler/
├── payloadFormatValidation/
├── requestRouting/
├── serviceManagement/
├── servicesAPI/
├── responseHandler/
├── serverManagement/
└── cryptography/
    ├── commonCrypto/
    ├── cryptoAlgorithms/
    ├── algorithmAllowlist/
    └── encryptionMethods/
        ├── JWE/
        ├── AES_RSA/
        └── JWS_AES_RSA/
```

The structure may evolve as Phase 2 introduces additional routing, authentication, authorization, and persistence layers.

## Documentation

* [`ARCHITECTURE.md`](./ARCHITECTURE.md) — detailed architecture, responsibility boundaries, design decisions, and future roadmap
* [`certs/Certificate_Setup_Guide.md`](./certs/Certificate_Setup_Guide.md) — local certificate setup
* [`LICENSE`](./LICENSE) — MIT License

## Intended Use

This project is intended for:

* Learning
* Local development
* API security testing
* HTTPS/mTLS experimentation
* Application encryption/decryption testing
* Architecture and framework design experimentation

It is **not a certified banking solution, security product, or production security recommendation**.

Users are responsible for evaluating and validating the framework for their own environment and requirements.

## Development Approach

The project is developed from the author's own architecture, requirements, design decisions, and implementation approach.

AI-assisted development tools, including ChatGPT, may be used to help translate requirements into code, explain implementation details, refactor code, and assist with review and troubleshooting.

The project is not intentionally developed by reproducing source code from a specific third-party project or library.

## Third-Party Dependencies

The project uses third-party open-source dependencies. Each dependency remains subject to its own license and terms.

The project's MIT license applies to the project's own code and materials and does not replace or modify the licenses of third-party dependencies.

## License

This project is licensed under the **MIT License**.

See [`LICENSE`](./LICENSE) for the complete license text.
