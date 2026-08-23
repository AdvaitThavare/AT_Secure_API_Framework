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

a. Dynamic IV — AES_RSA and JWS_AES_RSA
AES_RSA and JWS_AES_RSA will use a fresh 16-byte cryptographically random IV for every AES-CBC encryption operation. The IV will be transported as a standard Base64-encoded value in the existing JSON encrypted-payload wrapper. Since 16 bytes always produce exactly 24 characters in standard Base64, the wrapper validator will first perform a lightweight 24-character length check, followed by Base64 validation and decoded-length verification to ensure the resulting IV is exactly 16 bytes. During decryption, the IV will be Base64-decoded before being supplied to AES-CBC. The IV is transportable alongside the encrypted payload and does not require encryption itself.

b. JWS Algorithm/Type Validation: JWS validation will use an explicit allowlist of supported alg + typ combinations. RS256 + JWT is currently the only allowed combination, while the design permits additional explicitly supported combinations to be added later. alg is mandatory for all supported combinations, while typ is conditionally mandatory based on the requirements of the allowlisted combination. The allowlist is initially maintained within the decryption strategy, with the option to extract it into a dedicated JWS-specific module if the validation rules grow or require reuse.

c. JWS Algorithm/Type Validation: The JWS_AES_RSA decryption strategy will validate incoming JWS tokens against an explicit allowlist of supported alg + typ combinations. The current allowed combination is RS256 + JWT. The allowlist is initially maintained within the decryption strategy, with the option to extract it into a dedicated JWS-specific .ts module under the JWS_AES_RSA folder if the validation rules grow or require reuse.

d. JWS Error Handling: JWS validation and cryptographic failures will maintain distinct internal error conditions for diagnostics and troubleshooting. External responses will expose specific errors for harmless request-format or validation failures where appropriate, while security-sensitive failures will be mapped to generic external errors when revealing the specific failure could disclose sensitive information or assist request manipulation.

e. JWS Validation and Payload Handling: The JWS_AES_RSA decryption flow will parse and validate the JWS protected header, validate the allowlisted alg + typ combination, and verify the JWS signature before treating the payload as trusted data. Payload decoding remains within the JWS strategy; shared encoding/decoding primitives may be extracted later where genuinely reusable.

f. Shared Cryptographic Utilities: Common low-level cryptographic operations will be centralized into reusable utilities. AES will support mapped AES-CBC and AES-GCM encryption/decryption, while RSA will support mapped encryption/decryption and signing/verification. Common utilities will handle genuinely shared operations such as encoding/decoding, byte/string/ArrayBuffer conversions, random-byte generation, IV generation, and AES-key generation. Protocol-specific composition will remain within the respective cryptography strategies. Paired operations will remain grouped unless future complexity justifies separating them.

g. Cryptographic Utility Algorithm Handling: Each cryptographic utility will maintain an explicit allowlist of supported algorithms/operations and enforce their algorithm-specific requirements. Protocol strategies will select the required cryptographic operation, while common crypto utilities will provide generic primitives such as secure random-byte generation. Algorithm-specific utilities will determine required key/IV sizes and request the necessary byte lengths from the common utilities.

h. Common Cryptographic Utility: The common utility will provide genuinely reusable low-level primitives, initially including secure random-byte generation (generateRandomBytes(length)), Base64/Base64URL encoding and decoding, and byte/string/ArrayBuffer conversions. Algorithm- and protocol-specific logic will remain outside this utility. Additional generic primitives may be added later if required by the implementation.

i. Cryptographic Utility Error Handling: Cryptographic utilities will detect and propagate technical failures without creating protocol-specific AppErrors or error messages. The respective strategy will interpret the failure and explicitly create the appropriate application-level error, allowing utilities to remain reusable and independent of protocol-specific error handling.

j. Key and Certificate Handling: Certificate/key storage and resolution will remain separate from TLS configuration and cryptography strategies. A reusable key-management layer will initially resolve certificate/key material from the repository's certs storage, while remaining replaceable by future storage mechanisms without requiring changes to individual cryptography strategies. The layer will remain storage- and protocol-agnostic, allowing the same underlying key-management approach to support TLS and application-level cryptography independently.

k. Cryptographic API Standardization: The new cryptographic utility layer will standardize on the Web Crypto API for supported cryptographic operations, rather than maintaining separate Node crypto and Web Crypto implementations. Canonical Web Crypto/standard cryptographic terminology will be used in code and algorithm allowlists; commonly encountered alternate/provider-specific names may be documented alongside them for reference. Protocol strategies will remain independent of the underlying cryptographic API.

l. Cryptography Strategy Cleanup: Refactor JWE, AES_RSA, and JWS_AES_RSA strategies to delegate low-level cryptographic operations to the shared utilities while retaining protocol-specific validation, composition, orchestration, and response/error interpretation within the respective strategies. Exact responsibilities will be finalized during implementation based on the current code.

m. Encrypted Wrapper Validation and Normalization: encWrapperValidator.ts will remain responsible for validating the external encrypted-wrapper structure and normalizing it into the explicit internal EncryptedWrapper representation. It will contain only generic, algorithm-independent validation; encryption/protocol-specific validation, such as IV length requirements, will remain with the applicable cryptographic strategy or utility. A separate normalization layer will not be introduced unless normalization complexity later justifies it.

n. Payload State and Data Encryption Handling: payloadTypeIdentifier.ts will remain the centralized layer for identifying and validating the allowed Payload State ↔ Data Encryption combinations using an explicit allowlist, with VALID_COMBINATIONS as the source of truth. The request headers will be renamed from x-payload-type to X-Payload-State and from x-encryption-type to X-Data-Encryption. Redundant standalone validation Sets will not be maintained where the allowlist already provides the required validation. Header capture/storage mechanics remain part of the separate centralized header-handling discussion.

o. Centralized Header Handling: RequestContext will maintain separate normalized collections for request and response headers using Record<string, string[]>. Header names will be normalized to lowercase, while single and multiple values will consistently be represented as arrays without losing information. Layers will perform explicit header lookups and extract only the headers they require; interpreted values such as PayloadState and DataEncryption may remain as typed context properties.

p. Response Architecture: Keep response construction protocol-specific within the respective cryptography strategies, while maintaining the application response payload and response headers as separate RequestContext data. Common HTTP response handling will remain responsible only for delivering the finalized status, headers, and payload, without introducing protocol-specific response abstractions or unnecessary additional layers.

q. Unified Plain-Payload Parsing: Cryptographic strategies will be responsible for decrypting/decoding the payload but will not perform application-level parsing. The decrypted application payload will be placed in context.requestRawBody, after which requestValidator.ts will perform the common content-type-based parsing and validation used by both plain and encrypted requests. A dedicated header will identify the decrypted payload's content type for encrypted requests, with the final header name to be decided during implementation. The corresponding response terminology will use context.responseRawBody for consistency.

Roadmap:
0. Baseline / repository review
        ↓
1. RequestContext foundation
   - request headers
   - response headers
   - requestRawBody
   - responseRawBody
        ↓
2. Centralized Header Handling
   - normalize Node headers → Record<string, string[]>
   - explicit header lookup
   - update header consumers
        ↓
3. Payload State / Data Encryption refactor
   - rename headers
   - remove redundant Sets
   - update VALID_COMBINATIONS usage
        ↓
4. Encrypted Wrapper Validation
   - structural validation
   - wrapper normalization
   - generic IV/Base64 structural checks
        ↓
5. Key & Certificate Management
   - extract key/certificate loading
   - decouple strategies and TLS from storage
        ↓
6. Common Crypto Utility
   - Web Crypto standardization
   - random bytes
   - encoding/decoding
   - conversions
        ↓
7. AES Utility
   - AES-CBC
   - AES-GCM
   - algorithm allowlist
   - key/IV requirements
        ↓
8. RSA Utility
   - RSA encryption/decryption
   - RSA signing/verification
   - algorithm allowlist
        ↓
9. JWE Strategy Refactor
        ↓
10. AES_RSA Strategy Refactor
   - dynamic IV
        ↓
11. JWS_AES_RSA Strategy Refactor
   - alg + typ allowlist
   - JWS validation
   - signature verification
        ↓
12. Unified requestRawBody + requestValidator Flow
   - encrypted/plain convergence
   - decrypted content-type handling
   - move application parsing out of strategies
        ↓
13. Response Architecture
   - responseRawBody
   - response headers
   - common HTTP response delivery
        ↓
14. Final Cleanup
   - imports
   - obsolete code
   - naming
   - dead/redundant logic
        ↓
15. Regression Testing
   - existing plain flows
   - existing encrypted flows
   - new IV behavior
   - headers
   - validation/error paths
        ↓
16. Consolidated architecture.md Update


Next phase:
1. Internal CryptoExecutionContext validation

Purpose:

Verify that every strategy has populated all parameters required for encryption/decryption before proceeding.

Note- Remember, we are fine with code not compiling during the process of this implementation. So we can do all the required changes layer by layer, without worrying about compilation.

API vs Framework Error Boundary

The framework and individual API services maintain separate error responsibilities. Framework errors represent failures in request processing, cryptographic operations, wrapper/header validation, or other infrastructure-level processing and are represented internally as AppError and handled by sendError(). API-level errors, including API input validation, functional failures, and business-rule failures, are constructed by the individual API service as part of its ServiceResponse payload. The API response contract may evolve independently for each service, including additional responseStatus fields, without requiring changes to the framework's error-handling architecture.

Response Serialization

API services return a representation-neutral ServiceResponse containing the response payload, status code, and response headers. Content-Type-specific serialization is intentionally kept outside the API service and HTTP response handler. A dedicated response serialization layer will later convert the service payload into its wire representation based on the declared media type. This layer will be extensible through media-type-specific serializers and will not require changes to API services, service dispatching, cryptography, or framework error handling.

Response Serialization — Architectural Decision

A dedicated response serialization layer will sit between the API service and HTTP response handling. API services will continue to return a representation-neutral ServiceResponse containing statusCode, responseHeaders, and payload. The serialization layer will convert the payload into its wire representation based on the declared Content-Type. Initially, it will use simple JSON/text handling only; this is intentionally a temporary implementation. Future media types such as XML can be added within the serialization layer without requiring changes to API services, serviceDispatcher, cryptography, or responseHandler.

For responseHandler.ts
However, there is one thing I'd change from this proposal before you implement it:

We don't actually need ServiceResponse as an argument anymore if we pass the HTTP metadata separately. But I don't recommend doing that yet, because it would duplicate fields unnecessarily.

Content-Type always represents the actual API payload, not the encrypted transport wrapper. For encrypted requests/responses, x-enc-wrapper-content-type represents the encrypted wrapper's media type and is currently always application/json. The API service is authoritative for the actual response Content-Type; downstream serialization and encryption layers must preserve it. Encryption must not replace the API payload's Content-Type with application/json.

Deferred encryption test coverage: Plain-text request scenarios for AES_RSA and JWS_AES_RSA are currently deferred because the existing Postman setup cannot generate the required plaintext encrypted request. JSON-based encrypted flows and JSON payloads delivered as text/plain have been validated successfully. Plain-text encryption is expected to follow the same response serialization → encryption pipeline and will be tested when a suitable client/test setup is available.