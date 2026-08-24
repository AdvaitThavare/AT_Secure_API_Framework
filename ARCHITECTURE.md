# AT_Secure_API_Framework — Architecture

## 1. Purpose

`AT_Secure_API_Framework` is a TypeScript-based API security testing framework for developing and validating secure API flows.

The framework currently provides:

* HTTPS with mutual TLS (mTLS / 2-way SSL)
* Centralized request preparation and header normalization
* Request routing and payload/encryption identification
* Content-Type-based request parsing and validation
* Application-level encryption/decryption
* Reusable AES/RSA cryptographic utilities
* Protocol-specific cryptography strategies
* API service dispatch and response handling
* Response serialization
* Common framework error handling
* Postman-based interoperability and end-to-end verification

The current implementation uses a local HTTPS echo server as the development and interoperability environment.

---

# 2. Project Phases

## Phase 0 — Secure Flow Foundation

Established the initial end-to-end secure flow:

* HTTPS/mTLS
* Certificate/key setup
* Plain request/response processing
* Application encryption/decryption
* Initial cryptographic strategies
* End-to-end verification

**Status: Complete**

## Phase 1 — Framework Architecture Refactor

Refactored the initial implementation into reusable and clearly separated layers.

Completed areas include:

* Request preparation extraction
* RequestContext cleanup
* Centralized header normalization
* Payload/encryption identification
* Encrypted-wrapper validation and normalization
* Map-based request parsing
* Common cryptographic utilities
* AES/RSA utilities
* Algorithm allowlists
* Cryptography strategy cleanup
* Response serialization
* Framework/API error separation
* HTTPS bootstrap extraction
* Server orchestration cleanup
* Centralized encrypted-wrapper response metadata
* `base64iv` terminology

**Status: Complete**

## Phase 2 — Application and API Security Expansion

The next phase will introduce:

* URL/method validation
* Automated regression testing
* Client identity and API subscriptions
* User/customer authentication and authorization
* Realistic API services and persistence
* Multiple-client certificate identity mapping

These may be implemented incrementally as Phase-2 sub-phases.

---

# 3. Current Architecture

```text
Client / Postman
       |
       | HTTPS + mTLS
       v
HTTPS Bootstrap
       |
       v
Request Handler
       |
       v
RequestContext
       |
       +--> Method / Endpoint Routing
       |
       +--> Payload / Encryption Identification
       |
       +--> ENCRYPTED
       |      |
       |      +--> Wrapper Validation
       |      +--> Decryption
       |
       +--> Request Parsing / Validation
       |
       v
Service Dispatcher
       |
       v
API Service
       |
       v
ServiceResponse
       |
       v
Response Serialization
       |
       +--> ENCRYPTED
       |      |
       |      +--> Encryption
       |
       v
Response Header Composition
       |
       v
HTTP Response
```

`server.ts` is intentionally an orchestrator. The pipeline remains visible there, while implementation details remain inside dedicated layers.

The standard orchestration pattern is:

```text
layer
  |
  v
result
  |
  +--> error → sendError() → return
  |
  +--> success → continue
```

Plain/encrypted branches remain in `server.ts` when they represent genuine pipeline decisions.

---

# 4. Request Preparation and RequestContext

## Request Handler

`requestHandler.ts` owns request preparation:

* consumes the request body stream
* creates `requestRawBody`
* normalizes request headers
* creates `RequestContext`
* initializes framework response headers

`server.ts` does not perform these operations.

## RequestContext

Current conceptual structure:

```text
RequestContext
├── req
├── requestRawBody
├── requestHeaders
├── responseHeaders
├── requestMediaType
├── payload
├── payloadType
├── encryptionType
└── encryptedWrapper
```

### Raw/request state

```text
req
requestRawBody
requestHeaders
```

`req` remains available because the routing layers currently use request method and URL.

`requestHeaders` uses:

```ts
Record<string, string[]>
```

with lowercase header names and consistent array-based values.

### Derived state

```text
requestMediaType
payloadType
encryptionType
```

These are semantic values derived once by the appropriate framework layer.

The architecture avoids repeatedly interpreting raw framework headers.

### Encrypted wrapper

```text
EncryptedWrapper
├── payload
├── key?
└── base64iv?
```

The normalized internal wrapper isolates external field naming from cryptography strategies.

---

# 5. Header Handling

Request headers are normalized during request preparation.

Rules:

* header names are lowercase
* values are always represented as arrays
* multiple values are preserved
* downstream layers explicitly access only the headers they require

Framework headers follow this principle:

> If downstream code needs semantic information, derive it once at the appropriate interpretation/validation layer and expose that value through `RequestContext`.

Strict rule:

> Raw HTTP headers are accessed through `context.requestHeaders` and `context.responseHeaders`. Derived semantic values are stored in `RequestContext`. Downstream layers do not reinterpret a header when an appropriate semantic value already exists.

---

# 6. Payload and Encryption Identification

`payloadTypeIdentifier.ts` determines:

* Payload State
* Data Encryption
* Encrypted Wrapper Content Type

Supported payload states:

```text
PLAIN
ENCRYPTED
```

Supported encryption types:

```text
NA
JWE
AES_RSA
JWS_AES_RSA
```

Current valid combinations:

```text
PLAIN
 └── NA

ENCRYPTED
 ├── JWE
 ├── AES_RSA
 └── JWS_AES_RSA
```

`VALID_COMBINATIONS` is the source of truth.

Current framework headers:

```text
X-Payload-State
X-Data-Encryption
X-Enc-Wrapper-Content-Type
```

---

# 7. Request Parsing and Validation

Request parsing intentionally remains part of `requestValidator`.

The flow is:

```text
Content-Type
    |
    v
normalizeMediaType()
    |
    v
requestParserMap
    |
    +--> parseJSON
    |
    +--> parseText
    |
    v
parsed payload
```

Current request media types:

```text
application/json
text/plain
```

The parser map is the extension point for future media types.

Parser functions:

* parse the supplied representation
* return success/failure and parsed payload
* do not create `AppError`
* remain independent of HTTP/framework error handling

`requestValidator` owns:

* Content-Type validation
* media-type normalization
* parser selection
* parser-result interpretation
* `requestMediaType`
* parsed `payload`

Parsing establishes representation validity only. Business and functional validation remain the responsibility of the API service.

A separate request-normalizer layer is not required unless future requirements introduce responsibilities beyond media-type parsing.

---

# 8. Encrypted Request Flow

Encrypted requests follow the common application parsing path:

```text
Encrypted Request
      |
      v
Wrapper Validation
      |
      v
Cryptography Decryption
      |
      v
Decrypted requestRawBody
      |
      v
requestValidator
      |
      v
Parsed application payload
```

Cryptography strategies decrypt/decode the payload but do not perform application-level parsing.

After decryption, the resulting application representation is placed into:

```text
context.requestRawBody
```

`requestValidator` then performs the same content-type-based parsing used for plain requests.

---

# 9. Encrypted Wrapper Validation

`encWrapperValidator.ts` validates the external encrypted-wrapper structure and produces the normalized `EncryptedWrapper`.

Responsibilities include:

* outer JSON parsing
* wrapper structure validation
* required/forbidden field validation
* Base64 validation of `base64iv`
* decoded IV structural validation
* normalization into the internal wrapper

Transport terminology:

```text
base64iv
```

means the wrapper contains the Base64-encoded IV.

After decoding:

```text
base64iv
   |
   v
IV bytes
```

Protocol-specific cryptographic requirements remain with the applicable strategy or utility.

---

# 10. Cryptography Architecture

Cryptography uses a strategy map:

```text
encryptionType
      |
      v
cryptoHandlers
      |
      +--> decrypt()
      +--> encrypt()
```

Current strategies:

```text
JWE
AES_RSA
JWS_AES_RSA
```

The cryptography layer:

* selects the strategy
* orchestrates encryption/decryption
* carries `CryptoExecutionContext`
* applies common encrypted-wrapper transport metadata

Strategies own protocol-specific cryptographic behavior.

---

# 11. CryptoExecutionContext

`CryptoExecutionContext` is a runtime state carrier used across cryptographic operations.

It may contain:

```text
protocol
aes
rsa
signature
```

It stores parameters discovered during decryption and reused during encryption.

A separate `CryptoExecutionContext` validation layer was considered but intentionally not introduced because it provided insufficient value for the current project.

---

# 12. Common Cryptographic Utilities

Shared cryptographic utilities currently provide:

* secure random-byte generation
* Base64 encoding/decoding
* Base64URL encoding/decoding
* byte/string conversions
* ArrayBuffer-compatible conversions

These utilities remain protocol- and application-independent.

---

# 13. AES and RSA Utilities

## AES

Supported algorithms:

```text
AES-CBC
AES-GCM
```

AES-CBC is used by AES_RSA and JWS_AES_RSA.

AES-GCM is used by JWE.

The utilities use Web Crypto for AES operations and accept strategy-defined requirements such as key, IV, and tag lengths.

## RSA

Current shared RSA operations include:

```text
RSA encryption/decryption
RSA signing/verification
```

Strategy-specific parameters such as padding, OAEP hash, and signature algorithm are supplied by the calling strategy.

Cryptographic utilities remain independent of protocol-specific `AppError` handling.

---

# 14. Algorithm Allowlists

Supported algorithms are explicitly allowlisted.

## JWE

```text
RSA-OAEP-256 + A256GCM
```

## JWS

```text
RS256 + JWT
```

Additional algorithms must be explicitly added rather than being accepted generically.

---

# 15. JWE

Current configuration:

```text
RSA-OAEP-256
AES-256-GCM
128-bit authentication tag
```

JWE processing includes:

* protected-header parsing
* algorithm validation
* content-encryption-key decryption
* AES-GCM decryption/encryption
* JOSE compact representation handling

JWE provides confidentiality and authenticated encryption through AES-GCM.

---

# 16. AES_RSA

Current configuration:

```text
AES-256-CBC
PKCS#7 padding
16-byte IV
RSA/PKCS#1 v1.5
No signature
```

Flow:

```text
Plaintext
    |
    v
AES-256-CBC
    |
    v
Encrypted Payload

AES Key
    |
    v
RSA/PKCS#1 v1.5
    |
    v
Encrypted AES Key
```

A fresh cryptographically random IV is generated for every AES-CBC encryption operation.

The IV is transported in the encrypted JSON wrapper as:

```text
base64iv
```

---

# 17. JWS_AES_RSA

Current configuration:

```text
RS256
AES-256-CBC
PKCS#7 padding
16-byte IV
RSA/PKCS#1 v1.5
```

Flow:

```text
Plaintext
    |
    v
JWS / RS256
    |
    v
Signed plaintext
    |
    v
AES-256-CBC
    |
    v
Encrypted Payload

AES Key
    |
    v
RSA/PKCS#1 v1.5
    |
    v
Encrypted AES Key
```

Decryption validates the JWS protected header and verifies the signature before treating the extracted payload as trusted application data.

Current allowlist:

```text
RS256 + JWT
```

Security-sensitive failures may be mapped to generic external errors where appropriate.

---

# 18. Service Layer

`serviceDispatcher` maps a resolved route to an API service.

Current service:

```text
echoService
```

The service currently receives:

```text
payload
requestMediaType
```

because the echo API contract uses the request media type.

Services are not given the entire `RequestContext`.

A future service that does not require `requestMediaType` should not need to use it.

API services own:

* functional behavior
* business validation
* API response payload
* API response headers

Cryptographic responsibilities remain outside the service layer.

---

# 19. ServiceResponse and Error Boundary

API services return:

```text
ServiceResponse
├── statusCode
├── payload
└── responseHeaders
```

`ServiceResponse` is representation-neutral until response serialization.

Framework failures use:

```text
AppError
├── category
├── statusCode
├── errorCode
└── message
```

Framework errors cover request-processing, routing, validation, wrapper, cryptographic, and other infrastructure failures.

API-level failures remain inside the service response contract.

This keeps API response contracts independent from framework error handling.

---

# 20. Response Serialization and Headers

A dedicated response serialization layer converts `ServiceResponse.payload` into its wire representation based on the service-declared `Content-Type`.

Current response representations:

```text
application/json
text/plain
```

The serializer is the extension point for future formats such as XML.

## Response header ownership

### Service-level

```text
ServiceResponse.responseHeaders
```

Contains API response headers.

### Framework-level

```text
RequestContext.responseHeaders
```

Contains framework-generated headers.

The final response handler combines the two.

---

# 21. API Content-Type vs Encrypted Wrapper Content-Type

These headers intentionally describe different representations.

```text
Content-Type
    → media type of the decrypted API payload

X-Enc-Wrapper-Content-Type
    → media type of the encrypted transport wrapper
```

Therefore an encrypted response whose decrypted API payload is `text/plain` may correctly contain:

```text
Content-Type: text/plain
X-Enc-Wrapper-Content-Type: application/json
```

The outer encrypted body may appear as JSON text in an HTTP client while still being correctly identified as `text/plain` by the HTTP `Content-Type`.

This is a representation distinction, not an error.

`X-Enc-Wrapper-Content-Type` is currently set to `application/json` centrally by `cryptographyLayer`, since the encrypted transport wrapper is currently JSON regardless of the selected encryption strategy.

---

# 22. Response Flow

```text
ServiceResponse
      |
      v
Response Serializer
      |
      v
Serialized API payload
      |
      +--> ENCRYPTED
      |      |
      |      v
      |   Cryptography Layer
      |      |
      |      +--> encrypted body
      |      +--> wrapper metadata
      |
      v
Response Handler
      |
      v
HTTP Response
```

The API service remains authoritative for the API payload's `Content-Type`.

The cryptography layer adds encryption-specific transport metadata.

---

# 23. TLS and Key/Certificate Handling

TLS configuration and application cryptographic key resolution remain conceptually separate.

Current TLS uses:

```text
Local CA
Server certificate
Server private key
Client certificate
```

Application cryptography resolves its required key/certificate material through dedicated configuration.

The architecture keeps:

```text
Key / certificate storage
        |
        +--> TLS
        |
        +--> Application cryptography
```

as separate responsibilities so storage mechanisms can evolve independently.

A future key/certificate abstraction may replace the current local certificate storage without requiring changes to individual cryptography strategies.

---

# 24. Current Verification

Manual/Postman verification currently covers:

```text
JWE
AES_RSA
JWS_AES_RSA
```

The secure flow has been verified end to end:

```text
HTTPS + mTLS
    ↓
request processing
    ↓
optional decryption
    ↓
request parsing
    ↓
service
    ↓
response serialization
    ↓
optional encryption
    ↓
HTTP response
```

Plain-text encrypted-request scenarios for AES_RSA and JWS_AES_RSA remain deferred because the current Postman setup cannot conveniently generate the required plaintext encrypted requests.

JSON-based encrypted flows and JSON payloads delivered with `text/plain` have been validated.

Automated regression testing is planned for Phase 2.

---

# 25. Phase 2 Roadmap

## 25.1 URL Validation and Routing

Replace the current separate method and endpoint routing boundary with:

```text
urlValidator
```

The goal is to validate:

* URL
* HTTP method
* method + URL compatibility
* resolved service

The initial implementation may use a small in-memory registry.

The registry should sit behind a replaceable boundary:

```text
urlValidator
    ↓
Route Registry / Repository
    |
    +--> current: in-memory
    +--> future: database-backed
```

A database becomes useful when route definitions become sufficiently dynamic or numerous, but `urlValidator` should remain independent of the storage mechanism.

## 25.2 Automated Regression Testing

Build an automated regression suite covering:

* plain flows
* encrypted flows
* all cryptography strategies
* headers
* parsing and validation
* routing
* error paths
* response serialization
* dynamic IV behavior
* API/service integration

The suite should become the safety net for subsequent Phase-2 development.

## 25.3 Client ID / Client Secret and API Subscriptions

Introduce an application/subscription model:

```text
Customer
   |
   v
Application
   ├── Client ID
   ├── Client Secret
   └── API subscriptions
```

Example:

```text
Customer A
    |
    +--> Test-1
          ├── Echo API      subscribed
          └── Balance API   not subscribed
```

Request flow:

```text
Client ID + Secret
       |
       v
Identify Application
       |
       v
Check API subscription
       |
       +--> subscribed → continue
       |
       +--> not subscribed → API not subscribed
```

The initial implementation may use an in-memory client/application registry.

A future database-backed repository can replace the registry.

Client secrets remain within the client-authentication boundary and should not be unnecessarily propagated to API services.

## 25.4 User Authentication / Basic Auth

Introduce a separate customer/user authentication layer for APIs that access customer-owned data.

The expected representation is:

```text
Authorization:
Basic <Base64(username:password)>
```

The client/application identity and customer/user identity are separate security concepts.

Example request:

```text
Client ID
Client Secret
Authorization: Basic ...
CustomerID
AccountNumber
```

Expected flow:

```text
Client Authentication
       ↓
API Subscription Authorization
       ↓
User / Customer Authentication
       ↓
API Service
       ↓
Business Validation
       ↓
Customer / Service DB
```

Possible failures include:

* invalid client credentials
* API not subscribed
* invalid Basic Auth credentials
* invalid CustomerID / AccountNumber relationship

Authentication and authorization data should remain conceptually separate from business data, even if development deployments use a shared database server.

## 25.5 Mock API Services and Persistence

Add representative APIs for realistic integration testing.

Initial candidates:

```text
Customer Addition
Balance Enquiry
```

These provide both write and read use cases.

The services should be backed by representative persistence before completing the full customer authentication/authorization flow.

Service-specific persistence should use repository boundaries:

```text
CustomerService
    ↓
CustomerRepository
    ↓
Customer DB
```

```text
BalanceService
    ↓
BalanceRepository
    ↓
Balance DB
```

Initial repositories may be simple implementations; future implementations may use SQL/database storage.

## 25.6 Multiple Clients and Certificate Identity

Extend the framework from a single-client environment to multiple client applications.

Conceptual model:

```text
Client Application
    ├── Client ID
    ├── Client Secret
    └── Certificate Identity
```

The presented mTLS certificate should be mapped to the corresponding client identity using an appropriate certificate identifier such as fingerprint, serial number, subject, or SAN.

Flow:

```text
Client certificate
       ↓
Certificate identity
       ↓
Client ID
       ↓
Client authentication / subscription authorization
```

The client's private key remains client-side and is never used as a server-side identity record.

---

# 26. Phase 2 Security Model

The intended future security pipeline is:

```text
HTTPS + mTLS
      |
      v
Request Preparation
      |
      v
URL / Method Validation
      |
      v
Client Authentication
(Client ID + Secret)
      |
      v
API Subscription Authorization
      |
      v
Optional User Authentication
(Basic Auth / customer credentials)
      |
      v
API Service
      |
      v
Business Validation
      |
      v
Service / Customer Database
      |
      v
Response Serialization
      |
      v
Optional Application Encryption
      |
      v
HTTP Response
```

Each security boundary has a distinct responsibility:

```text
mTLS
→ transport/client certificate trust

Client ID + Secret
→ application identity

API subscription
→ application-level API access

Basic Auth
→ customer/user authentication

API business logic
→ resource/business validation
```

---

# 27. Future Architectural Principles

The framework should continue to follow these principles:

* Keep `server.ts` focused on orchestration.
* Keep framework transport concerns separate from service/business concerns.
* Normalize and interpret headers once.
* Prefer semantic context values over repeated raw-header interpretation.
* Keep cryptography strategies protocol-specific.
* Keep common cryptographic primitives reusable.
* Keep services free of cryptographic implementation.
* Keep API business validation within the service boundary.
* Keep framework errors separate from API responses.
* Keep API response `Content-Type` independent from encrypted wrapper media type.
* Introduce repository boundaries before committing the framework to a particular storage mechanism.
* Start with small in-memory registries when they are sufficient for development.
* Avoid speculative abstractions until actual requirements justify them.
* Preserve working secure flows during future refactoring.
* Treat security-sensitive information such as secrets and private keys as confined to the appropriate security boundary.

---

# 28. Current Status

```text
Phase 0 — Complete
Phase 1 — Complete
Phase 2 — Planned
```

Current framework scope:

```text
HTTPS + mTLS
      +
Request preparation
      +
Normalized headers
      +
Request parsing / validation
      +
Routing
      +
JWE
      +
AES_RSA
      +
JWS_AES_RSA
      +
Response serialization
      +
Framework error handling
      +
Postman interoperability verification
```

Future Phase-2 scope:

```text
URL / method authorization
      +
Client applications
      +
API subscriptions
      +
User/customer authentication
      +
Authorization
      +
Realistic API services
      +
Persistence
      +
Multiple-client certificate identity
```

This document describes both the current implementation and the agreed architectural direction. Future implementation details may evolve as requirements grow, but changes should preserve the established responsibility boundaries and security model.
