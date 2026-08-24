# AT_Secure_API_Framework — Architecture

## 1. Purpose

`AT_Secure_API_Framework` is a TypeScript-based API security testing framework built around:

* HTTPS with mutual TLS (mTLS)
* Secure request processing
* Payload/encryption routing
* JOSE/JWE
* AES_RSA
* JWS_AES_RSA
* Reusable service and cryptography layers

The current implementation uses a local HTTPS echo server for development and interoperability testing.

---

## 2. Current Architecture

```text
Client / Postman
       |
       | HTTPS + mTLS
       v
Local HTTPS Server
       |
       +--> Method Routing
       |
       +--> Endpoint Routing
       |
       +--> Payload / Encryption Identification
       |
       +--> ENCRYPTED
       |      |
       |      +--> Encrypted Wrapper Validation
       |      +--> Request Normalization
       |      +--> Cryptography Decryption
       |
       +--> PLAIN
       |
       +--> Common Request Validation
       |
       v
Service Dispatcher
       |
       v
Service
       |
       v
Service Response
       |
       +--> ENCRYPTED
       |      |
       |      +--> Cryptography Encryption
       |
       v
HTTP Response
```

The server currently uses a `RequestContext` object to carry request, payload, service-response, routing, and cryptography state through the pipeline.

---

## 3. Request Context

`RequestContext` currently contains:

```text
RequestContext
├── req
├── res
├── rawBody
├── payload
├── serviceResponse
├── contentType
├── payloadType
├── encryptionType
└── encryptedWrapper
```

`encryptedWrapper` is the normalized internal representation of an encrypted request:

```text
{
    payload: string,
    key?: string
}
```

The external request wrapper can therefore change without requiring individual cryptography strategies to understand the external field names.

---

## 4. Request Processing Pipeline

The current request flow is:

```text
1. Receive HTTP request
2. Build RequestContext
3. Validate HTTP method
4. Resolve endpoint
5. Identify payload state and encryption type
6. Validate encrypted wrapper when applicable
7. Normalize encrypted wrapper
8. Decrypt encrypted payload when applicable
9. Perform common request validation
10. Dispatch to service
11. Encrypt service response when applicable
12. Send HTTP response
```

Service-specific business and schema validation remains the responsibility of the individual service rather than the common request-validation layer.

---

## 5. Payload and Encryption Types

Supported payload states:

```text
PLAIN
ENCRYPTED
```

Supported data encryption types:

```text
NA
JWE
AES_RSA
JWS_AES_RSA
```

Current valid combinations:

```text
PLAIN     → NA

ENCRYPTED → JWE
ENCRYPTED → AES_RSA
ENCRYPTED → JWS_AES_RSA
```

The payload/encryption identifier validates these combinations before the cryptography layer is reached.

---

## 6. Encrypted Request Normalization

Encrypted requests currently use an external wrapper such as:

```json
{
  "encReqPayload": "...",
  "encReqKey": "..."
}
```

`JWE` does not require `encReqKey`.

`AES_RSA` and `JWS_AES_RSA` require `encReqKey`.

The encrypted wrapper validator:

1. Parses the outer JSON wrapper.
2. Validates required fields.
3. Applies encryption-specific wrapper rules.
4. Converts the external representation into the internal `EncryptedWrapper`.
5. Passes the normalized representation to the cryptography strategy.

This keeps external wrapper naming separate from cryptography implementation details.

---

## 7. Cryptography Layer

Cryptography uses a strategy map:

```text
encryptionType
      |
      v
cryptoHandlers
      |
      +--> decrypt(context)
      |
      +--> encrypt(context)
```

Current strategies:

```text
JWE
AES_RSA
JWS_AES_RSA
```

Each strategy implements the same application-level contract:

```text
decrypt(context)
encrypt(context)
```

The strategy owns its protocol-specific behavior and response representation.

---

## 8. JWE

Current JWE configuration:

```text
JWE
├── Key encryption : RSA-OAEP-256
├── Content encryption : AES-256-GCM
├── Authentication tag : 128-bit
└── Protected header : AAD
```

JWE provides both confidentiality and authenticated encryption through AES-GCM.

---

## 9. AES_RSA

Current AES_RSA flow:

```text
Plaintext
    |
    v
AES-256-CBC
    |
    v
Encrypted payload

AES key
    |
    v
RSA/PKCS#1 v1.5
    |
    v
Encrypted AES key
```

Current characteristics:

```text
AES       : AES-256-CBC
Padding   : PKCS#7
IV        : 16 bytes
RSA       : RSA/ECB/PKCS1Padding
Signature : None
```

The absence of a signature is intentional.

AES_RSA is designed as the confidentiality-oriented flow.

---

## 10. JWS_AES_RSA

Current JWS_AES_RSA flow:

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
Encrypted payload

AES key
    |
    v
RSA/PKCS#1 v1.5
    |
    v
Encrypted AES key
```

Current characteristics:

```text
JWS       : RS256
AES       : AES-256-CBC
Padding   : PKCS#7
IV        : 16 bytes
RSA       : RSA/ECB/PKCS1Padding
```

During decryption:

```text
RSA decrypt AES key
       ↓
AES decrypt payload
       ↓
Verify JWS signature
       ↓
Extract JSON payload
```

The additional JWS layer provides integrity/authenticity for the plaintext before AES encryption.

---

## 11. Response Handling

Response encryption remains the responsibility of the selected cryptography strategy.

The strategies produce their protocol-specific response structures.

For encrypted responses, the external representation is:

```json
{
  "encResPayload": "...",
  "encResKey": "..."
}
```

JWE does not require an encrypted AES key in the same manner as AES_RSA/JWS_AES_RSA.

The common HTTP response handler is responsible for sending the resulting response, but does not implement cryptographic response construction.

---

## 12. Service Layer

The service dispatcher maps a resolved route to a service handler.

Current service:

```text
echoService
```

The service receives the processed payload and produces the service response.

Cryptographic processing remains outside the service layer.

---

## 13. Error Handling

The framework uses a common `AppError` structure:

```text
category
statusCode
errorCode
message
```

Errors are returned from the responsible layer and handled by the common error-response mechanism.

The design intentionally separates:

```text
Common pipeline errors
        +
Cryptography-specific errors
        +
Service-specific errors
```

---

## 14. TLS and Cryptographic Keys

The local server uses mTLS with:

```text
Local CA
Server certificate
Server private key
Client certificate
```

The same certificate/key material may also be used for application-level cryptographic operations where required by the protocol or partner specification.

This is intentional and does not require separate physical keys.

Future configuration cleanup may separate the **TLS configuration naming** from the **application cryptography configuration naming** without requiring different certificates or keys.

---

## 15. Current Verification

The three encrypted flows have been verified through Postman:

```text
JWE
AES_RSA
JWS_AES_RSA
```

The encrypted request → decryption → service → encryption → response flow is functioning.

Postman is currently used for manual/interoperability verification.

A separate automated regression test layer is planned for protecting the TypeScript architecture during future refactoring.

---

# 16. Planned Architecture Tasks

The following tasks are planned and are not necessarily implemented yet.

### Phase 1 — Request and code structure

1. Redesign `RequestContext` header handling around a centralized `headers` representation.
2. Keep interpreted values such as `payloadType` and `encryptionType` separate from raw headers.
3. Update `payloadTypeIdentifier` to use the new header representation.
4. Clean redundant/unused code in request identification.
5. Review and maintain encrypted-wrapper normalization as the single external-to-internal boundary.
6. Extract reusable low-level cryptographic utilities for shared AES/RSA operations.
7. Add automated regression tests for the current pipeline and cryptography strategies.

### Phase 2 — Pipeline and routing

8. Extract the main request-processing pipeline from `server.ts`.
9. Harden service registration and dispatch.
10. Normalize endpoint matching using URL pathname.
11. Review the relationship between method, endpoint, and service routing.

### Phase 3 — Design discussions

12. Decide whether routing should remain code-defined or eventually use an external/database-backed configuration.
13. Review the final HTTP header naming convention.
14. Review request/response content-type handling as part of the header redesign.

### Phase 4 — Cryptography

15. Design dynamic IV handling for AES-CBC.
16. Define how the IV is transported in the encrypted wrapper/protocol before implementation.
17. Harden JWS protected-header validation.
18. Review AES_RSA and JWS_AES_RSA protocol contracts without changing their intended cryptographic behavior.
19. Review TLS/application cryptography configuration naming.

### Phase 5 — Documentation

20. Update this `ARCHITECTURE.md` whenever the architecture changes.
21. Prepare a concise `README.md` covering setup, architecture, supported encryption flows, testing, usage, and security considerations.

---

## 17. Architectural Principles

The project follows these principles:

```text
Transport
    ↓
Routing
    ↓
Identification
    ↓
Validation / Normalization
    ↓
Cryptography
    ↓
Service
    ↓
Cryptography
    ↓
Response
```

Key principles:

* External request formats are normalized before reaching cryptography strategies.
* Cryptography strategies remain protocol-specific.
* Shared low-level cryptographic operations may be extracted into reusable utilities.
* Services should not contain cryptographic responsibilities.
* Common validation should not contain service-specific business validation.
* Response cryptographic structures remain owned by their respective strategies.
* Raw HTTP headers and interpreted application state should remain conceptually separate.
* Protocol-specific behavior should not be generalized merely to reduce code duplication.
* Future refactoring should preserve the current working request/response flows.

## 18. Architectural Decisions (to be incorporated properly in the architecture.md file later)

0. Server Request Preparation Refactor
├── move request body collection out of server.ts
├── move RequestContext construction out of server.ts
├── move request header normalization into request preparation
├── keep server.ts responsible for HTTPS/bootstrap + pipeline orchestration
└── remove protocol-specific response-header construction from server.ts

1. Request parsing map
   ├── parseJSON
   ├── parseText
   └── requestValidator → parser map

2. CryptoExecutionContext validation
   ├── validate required AES configuration
   ├── validate required RSA configuration
   ├── validate protocol configuration
   └── validate strategy-specific requirements

3. Cryptographic utility hardening
   ├── explicit algorithm allowlists
   ├── required key/IV parameter validation
   └── utility-level technical error boundaries

4. Cryptography strategy cleanup
   ├── JWE
   ├── AES_RSA
   └── JWS_AES_RSA

5. JWS hardening
   ├── alg/typ edge cases
   ├── validation ordering
   ├── malformed-token handling
   └── security-sensitive error mapping

6. Key/certificate abstraction review
   └── verify storage/protocol/TLS separation

7. Automated regression testing
   ├── plain flows
   ├── encrypted flows
   ├── headers
   ├── validation
   ├── error paths
   └── IV behavior

8. Deferred plaintext encrypted-request tests
   └── once a suitable client/test mechanism exists

9. Final code cleanup

10. Final ARCHITECTURE.md consolidation



API vs Framework Error Boundary-
The framework and individual API services maintain separate error responsibilities. Framework errors represent failures in request processing, cryptographic operations, wrapper/header validation, or other infrastructure-level processing and are represented internally as AppError and handled by sendError(). API-level errors, including API input validation, functional failures, and business-rule failures, are constructed by the individual API service as part of its ServiceResponse payload. The API response contract may evolve independently for each service, including additional responseStatus fields, without requiring changes to the framework's error-handling architecture.

Response Serialization — Architectural Decision-
A dedicated response serialization layer will sit between the API service and HTTP response handling. API services will continue to return a representation-neutral ServiceResponse containing statusCode, responseHeaders, and payload. The serialization layer will convert the payload into its wire representation based on the declared Content-Type. Initially, it will use simple JSON/text handling only; this is intentionally a temporary implementation. Future media types such as XML can be added within the serialization layer without requiring changes to API services, serviceDispatcher, cryptography, or responseHandler.

For responseHandler.ts- (Suggestion for future only)
We don't actually need ServiceResponse as an argument anymore if we pass the HTTP metadata separately. But I don't recommend doing that yet, because it would duplicate fields unnecessarily.


Deferred encryption test coverage-
Plain-text request scenarios for AES_RSA and JWS_AES_RSA are currently deferred because the existing Postman setup cannot generate the required plaintext encrypted request. JSON-based encrypted flows and JSON payloads delivered as text/plain have been validated successfully. Plain-text encryption is expected to follow the same response serialization → encryption pipeline and will be tested when a suitable client/test setup is available.

Future development guideline (to be documented in architecture md after cleanup)
    When introducing a new framework header, first decide whether downstream code needs the raw header or an interpreted value. If it needs semantic information, derive it once at the appropriate interpretation/validation layer and expose that semantic value through RequestContext.
    Strict Rule to be established
    Raw HTTP headers are accessed through context.requestHeaders / context.responseHeaders. Derived semantic values are stored in RequestContext and consumed by downstream layers. No downstream layer should reinterpret framework headers when a semantic value already exists.

Refactor server.ts so that it acts primarily as the HTTP/HTTPS bootstrap and request/response pipeline orchestrator. The request-processing flow should remain explicitly visible in server.ts, with each layer invoked sequentially and its result checked using a consistent error → sendError() → return pattern.

Move request preparation, header normalization, payload handling, Content-Type extraction, protocol-specific response-header construction, and other implementation responsibilities into their appropriate dedicated layers. Extract HTTPS server creation/bootstrap logic from server.ts where practical.

Conditional branches for plain versus encrypted flows may remain in server.ts when they represent genuine pipeline orchestration decisions. However, protocol-specific implementation details must remain encapsulated within their respective layers.

The resulting server.ts should be easy to read as a high-level representation of the framework pipeline, without requiring knowledge of the internal implementation of individual layers.

Mini-roadmap — Server Orchestration Refactor
Extract HTTPS server creation/bootstrap
Move https.createServer(...) and server.listen(...) responsibilities into the appropriate server/bootstrap layer.
Keep TLS configuration and server lifecycle concerns outside the orchestration logic.
Use requestHandler as the request preparation boundary
server.ts should receive the prepared RequestContext.
Request body collection and RequestContext construction stay outside server.ts.
Header normalization remains part of request preparation.
Remove direct header interpretation
Remove direct Content-Type extraction from server.ts.
Use the appropriate normalized/derived value from the request-processing layers/context.
Preserve visible pipeline orchestration
Keep sequential layer calls in server.ts.

Standardize the pattern:

layer → result → error? → sendError → return
Don't hide the entire pipeline behind another generic processRequest() abstraction.
Keep plain/encrypted branching only where it represents orchestration
ENCRYPTED → wrapper validation → decryption.
PLAIN → skip encrypted-specific processing.
Avoid moving genuine pipeline decisions unnecessarily.
Remove protocol-specific response logic
Encryption-specific response-header construction should leave server.ts.
Response serialization/encryption should remain delegated to their respective layers.
server.ts should only coordinate their execution and handle failures.
Review final server.ts
Verify that every remaining statement is either:
HTTPS/bootstrap responsibility,
pipeline orchestration, or
final HTTP response delivery.
Anything else should be challenged and moved if appropriate.