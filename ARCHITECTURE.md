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

Phase 2 begins with a foundational service-boundary step before introducing broader API security capabilities.

### Step 0 — Service Context and Cryptography API Service

#### ServiceContext

Introduce a dedicated `ServiceContext` as the service-facing view of request information.

`RequestContext` remains the authoritative framework request state and may contain framework-specific information required by routing, validation, cryptography, and response processing.

`ServiceContext` exposes only the request information that API services are intended to consume.

Conceptually:

```text
RequestContext
├── framework request state
├── routing state
├── validation state
├── cryptography state
├── response/framework state
└── service-relevant request state
             |
             v
      ServiceContext
             |
             v
         API Service
```

`ServiceContext` is derived from the existing `RequestContext` references rather than maintaining independent copies of request data.

This establishes a boundary between framework internals and API-service inputs while allowing the service-facing context to grow as future API requirements emerge.

Examples of information that may be exposed through `ServiceContext` include:

```text
payload
requestHeaders
requestMediaType
client identity
authentication state
service-relevant request metadata
```

Framework-specific information such as cryptographic execution state or internal wrapper state remains outside `ServiceContext` unless a future service requirement explicitly justifies exposing it.

#### Encryption/Decryption API Service

Introduce API services that expose the framework's encryption/decryption capabilities through normal API-service processing.

The purpose is to provide a real API-service consumer of the cryptography layer and establish a practical service-level verification path for:

```text
API Request
    |
    v
Service Layer
    |
    v
Cryptography Layer
    |
    v
Encrypted / Decrypted Response
```

This service is part of the framework implementation and validation scope. Automated test-client implementation is outside the current Phase-2 project scope.

### Remaining Phase-2 capabilities

After Step 0, Phase 2 will introduce:

* Unified URL/method validation
* Automated regression testing
* Client identity and API subscriptions
* User/customer authentication and authorization
* Realistic API services and persistence
* Multiple-client certificate identity mapping

These capabilities may be implemented incrementally as Phase-2 sub-phases.

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
Service Context
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

# 5. ServiceContext

`ServiceContext` is the service-facing subset of `RequestContext`.

Its purpose is to prevent API services from becoming coupled to the complete framework request state while still allowing services to consume request information required by their API contracts.

Conceptually:

```text
RequestContext
      |
      | selected references
      v
ServiceContext
      |
      v
API Service
```

The service context does not represent an independent copy of request data. It references the appropriate values already maintained by `RequestContext`.

Current service-facing information includes:

```text
requestHeaders
requestMediaType
payload
```

The context may grow as future API services introduce requirements such as:

```text
client identity
authentication state
authorization information
service-relevant request metadata
```

The framework context remains broader than the service context.

This distinction prevents framework-specific implementation details from automatically becoming part of the API-service contract.

---

# 6. Header Handling

Request headers are normalized during request preparation.

Rules:

* header names are lowercase
* values are always represented as arrays
* multiple values are preserved
* downstream layers explicitly access only the headers they require

Framework headers follow this principle:

> If downstream code needs semantic information, derive it once at the appropriate interpretation/validation layer and expose that value through `RequestContext`.

Raw HTTP headers are accessed through:

```text
context.requestHeaders
context.responseHeaders
```

Services access request headers through `ServiceContext` when their API contract requires them.

---

# 7. Payload and Encryption Identification

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

# 8. Request Parsing and Validation

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

# 9. Encrypted Request Flow

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

# 10. Encrypted Wrapper Validation

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

# 11. Cryptography Architecture

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

# 12. CryptoExecutionContext

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

# 13. Common Cryptographic Utilities

Shared cryptographic utilities currently provide:

* secure random-byte generation
* Base64 encoding/decoding
* Base64URL encoding/decoding
* byte/string conversions
* ArrayBuffer-compatible conversions

These utilities remain protocol- and application-independent.

---

# 14. AES and RSA Utilities

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

# 15. Algorithm Allowlists

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

# 16. JWE

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

# 17. AES_RSA

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

# 18. JWS_AES_RSA

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

# 19. Service Layer

`serviceDispatcher` maps a resolved route to an API service.

Current service:

```text
echoService
```

API services consume `ServiceContext` rather than the complete `RequestContext`.

The current service context includes:

```text
payload
requestHeaders
requestMediaType
```

This allows services to consume request information required by their API contract without requiring framework internals to become part of the service interface.

API services own:

* functional behavior
* business validation
* API response payload
* API response headers

Cryptographic responsibilities remain outside the service layer.

---

# 20. ServiceResponse and Error Boundary

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

# 21. Response Serialization and Headers

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

# 22. API Content-Type vs Encrypted Wrapper Content-Type

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

# 23. Response Flow

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

# 24. TLS and Key/Certificate Handling

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

# 25. Current Verification

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

Automated regression testing remains planned for Phase 2.

---

# 26. Future Phase-2 Direction

Phase 2 expands the framework from secure-flow experimentation toward application-level API security and realistic service behavior.

## URL and Method Validation

The current routing model separates method and endpoint checks.

The planned `urlValidator` boundary will validate both:

```text
HTTP method
+
URL / API endpoint
```

against a service registry.

The initial registry may remain a small in-code representation for framework development.

For a larger implementation, API/service registration data could be externalized to persistent storage such as a relational database, allowing validation to use data-driven service and method mappings.

The exact persistence architecture remains a future design decision.

## Automated Regression Testing

A repeatable automated regression suite will be introduced to verify framework behavior across:

* plain flows
* encrypted flows
* request validation
* response handling
* cryptographic strategies
* API services

The test-client implementation is intentionally treated separately from the framework implementation scope.

## Client ID / Client Secret and API Subscriptions

The framework will introduce an application/subscription model.

Conceptually:

```text
Customer
   |
   +--> Application
           |
           +--> Client ID
           +--> Client Secret
           |
           +--> API subscriptions
```

A client application may access only APIs to which it is subscribed.

For example:

```text
Application Test-1
├── Echo API       ✓
└── Balance API    ✗
```

A valid client ID/secret pair therefore does not automatically grant access to every API.

The initial implementation may use a small in-code registry. A scalable implementation could move client/application/subscription data to persistent storage.

## User/Customer Authentication and Authorization

Authentication will support API services that require customer-level access control.

The planned model uses Basic Authentication:

```text
Authorization: Basic <Base64(username:password)>
```

The username/password represents customer authentication credentials.

For example, a balance API may receive:

```text
CustomerID
AccountNumber
```

while requiring valid customer authentication before allowing the business operation to proceed.

Client subscription authorization and customer authentication are separate concerns:

```text
Client ID / Secret
    ↓
Is this application subscribed to the API?

Basic Authentication
    ↓
Is this customer/user authorized to perform the operation?
```

The initial implementation may use a small registry and mock persistence environment. The long-term design may use a database-backed identity and authorization model.

## Realistic API Services and Persistence

Additional API services will be introduced to exercise realistic service-to-database interactions.

Initial examples include:

```text
Customer Addition
Balance Enquiry
```

These services are intended to provide a realistic environment for validating:

```text
API
 ↓
Service
 ↓
Customer data store
```

The supporting database/persistence layer is expected to be established before implementing the full customer authentication flow.

## Multiple Client Certificate Identity

The framework will eventually support multiple client applications with certificate identity mapped to client identity.

Conceptually:

```text
Client ID
   |
   +--> client certificate / certificate identity
   |
   +--> application credentials
   |
   +--> API subscriptions
```

This extends the current single/local mTLS setup toward a multi-client model.

The exact certificate-to-client mapping and storage mechanism remain future architectural decisions.

---

# 27. Architectural Principles

The framework follows these principles:

### Separation of responsibilities

Each layer should own one clearly defined responsibility.

### Single source of truth

Semantic information should be derived once and reused rather than repeatedly reconstructed.

### Framework/service boundary

Framework internals should not automatically become API-service inputs.

`RequestContext` represents framework state; `ServiceContext` represents the service-facing request view.

### Strategy isolation

Cryptographic strategies own protocol-specific cryptographic behavior. The cryptography layer owns common orchestration and transport concerns.

### Explicit security controls

Algorithms, protocol combinations, and future access rules should be explicitly allowlisted or validated.

### Extensibility through maps and registries

Parser and cryptography selection use explicit maps. Future service and API registration can evolve toward data-driven persistence.

### Avoid premature abstraction

New layers, contexts, and abstractions should be introduced when they establish a meaningful responsibility boundary or solve a concrete scalability problem.

### Server orchestration

`server.ts` should remain readable as the framework pipeline rather than becoming a container for implementation details.

---

# 28. Project Status

```text
Phase 0 — Secure Flow Foundation       Complete
Phase 1 — Framework Architecture       Complete
Phase 2 — API Security Expansion       In Progress / Planned
```

Phase 2 begins with the ServiceContext boundary and an encryption/decryption API service before expanding into routing, client subscriptions, authentication, persistence, and multi-client identity.
