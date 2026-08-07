# AT_Secure_API_Framework --- Architecture

## 1. Purpose

`AT_Secure_API_Framework` is a TypeScript-based Playwright/API security
testing framework with a local HTTPS echo server supporting mutual TLS
(mTLS) and JOSE/JWE encrypted request-response flows.

Current implementation is focused on **JSON and plaintext payloads**,
with JWE using:

-   **JOSE / JWE**
-   **Content encryption:** AES-256-GCM
-   **Key encryption:** RSA-OAEP-256
-   **Signature:** None

------------------------------------------------------------------------

## 2. Current Architecture

``` text
Client / Postman
       |
       | HTTPS + mTLS
       v
Local Echo Server
       |
       +--> Method / Endpoint Routing
       |
       +--> Payload Type Identification
       |
       +--> ENCRYPTED
       |      |
       |      +--> JWE Wrapper Validation
       |      +--> JWE Decryption
       |      +--> Request Validation
       |
       +--> PLAIN
              |
              +--> Request Validation
       |
       v
Service Dispatcher
       |
       v
Service
       |
       +--> PLAIN request
       |      |
       |      +--> Plain response
       |
       +--> ENCRYPTED request
              |
              +--> JWE Response Encryption
              +--> Encrypted response
```

------------------------------------------------------------------------

## 3. Transport and mTLS

The local server runs over HTTPS on:

``` text
https://localhost:8443
```

The server:

-   uses a server private key and certificate;
-   trusts the local CA;
-   requires a client certificate;
-   rejects clients whose certificate is not trusted.

The project maintains separate certificate areas for:

``` text
certs/
├── ca/
├── client/
└── server/
```

The Playwright API client uses a reusable mTLS request context for local
API testing.

------------------------------------------------------------------------

## 4. Request Pipeline

The server receives the raw request body and builds a `RequestContext`.

The current request processing sequence is:

1.  Method routing
2.  Endpoint routing
3.  Payload type identification
4.  Encrypted wrapper validation, when applicable
5.  Payload decryption, when applicable
6.  Common request validation
7.  Service dispatch
8.  Response encryption, when applicable
9.  Response sending

`RequestContext` carries request/response state through the pipeline,
including the raw body, content type, payload, payload type, encryption
type, and service response.

------------------------------------------------------------------------

## 5. Payload Handling

### PLAIN

Plain requests currently support:

-   `application/json`
-   `text/plain`

`requestValidator.ts` performs transport/payload-format validation.

For JSON, it parses the raw body.

For plaintext, it stores the raw body as the payload.

Unsupported content types return `415 UNSUPPORTED_CONTENT_TYPE`.

### ENCRYPTED

The current encrypted flow supports JWE JSON payloads.

The HTTP headers currently used are:

``` text
x-payload-type
x-encryption-type
```

The encrypted request body contains the JWE wrapper.

For encrypted requests:

1.  The outer encrypted request is identified and validated.
2.  JWE is decrypted.
3.  The decrypted payload is validated as JSON inside `decryptJWE`.
4.  `requestValidator` remains part of the common pipeline but does not
    re-parse the decrypted payload from the original HTTP body.
5.  The resulting payload reaches the service layer.

Service-specific schema, field, and business validations are
intentionally handled at the individual service level rather than in
`requestValidator.ts`.

------------------------------------------------------------------------

## 6. JWE Cryptography

The current JWE implementation uses:

``` text
JWE
├── RSA-OAEP-256
│   └── Encrypt/decrypt CEK
│
└── AES-256-GCM
    ├── Encrypt/decrypt payload
    ├── 12-byte IV for server response encryption
    ├── 128-bit authentication tag
    └── Protected header as AAD
```

The decrypted request payload is placed into `context.payload`.

For an encrypted request, the service response is encrypted before
`sendResponse()`.

The client has been verified to successfully decrypt the
server-generated JWE response.

------------------------------------------------------------------------

## 7. Cryptography Layer

The cryptography layer uses a single strategy map for each encryption
type:

``` text
encryptionType
      |
      v
cryptoHandlers
      |
      +--> decrypt(context)
      |
      +--> encrypt(context)
```

Current registered strategies:

``` text
JWE
HIGH
MEDIUM
```

JWE has the implemented `decrypt` and `encrypt` handlers.

HIGH and MEDIUM are currently placeholders.

This allows the request's selected encryption type to determine both the
request decryption strategy and response encryption strategy.

------------------------------------------------------------------------

## 8. Service Layer

The current service dispatcher maps a route's service name to a service
handler.

The implemented service is:

``` text
echoService
```

The echo service currently returns the received payload unchanged.

Service-level validations are intended to remain within individual
services rather than becoming part of the common request validator.

------------------------------------------------------------------------

## 9. Error Handling

The framework uses a common `AppError` structure containing:

``` text
category
statusCode
errorCode
message
```

JWE currently has explicit error handling for:

-   invalid JWE format;
-   invalid encrypted CEK;
-   invalid decrypted JSON;
-   AES-GCM/JWE payload decryption failure;
-   response JSON serialization failure;
-   AES-GCM response encryption failure;
-   RSA-OAEP response CEK encryption failure.

Cryptographic authentication failures are intentionally exposed through
a general JWE payload error rather than revealing the specific
cryptographic component that failed.

------------------------------------------------------------------------

## 10. Current Verification State

The following JWE and regression scenarios have been tested
successfully:

-   valid encrypted JSON request → encrypted JSON response;
-   client-side decryption of encrypted response;
-   invalid decrypted JSON;
-   invalid JWE structure;
-   invalid encrypted CEK;
-   tampered JWE payload/authentication failure;
-   invalid response serialization;
-   AES response-encryption failure;
-   RSA response CEK-encryption failure;
-   plain `text/plain`;
-   plain `application/json`;
-   unsupported `application/xml`.

The current JWE request → service → encrypted response flow is therefore
end-to-end functional.

------------------------------------------------------------------------

## 11. Planned Actions

1.  Implement HIGH encryption/decryption.
2.  Implement MEDIUM encryption/decryption.
3.  Complete cryptographic regression testing for HIGH and MEDIUM.
4.  Define internal diagnostics for encrypted-response failures without
    exposing unnecessary cryptographic details to API consumers.
5.  Rename encryption headers:
    -   `x-payload-type` → `X-Payload-State`
    -   `x-encryption-type` → `X-Data-Encryption`
6.  Rename certificate configuration properties:
    -   `cert` → `serverCert`
    -   `key` → `serverKey`
7.  Update header handling --- replace the current individually managed
    header properties with a more consistent header representation.
8.  Merge `endpointRouter` and `methodRouter` --- details to be
    finalized.
9.  Finalize the service invocation/registration approach --- details to
    be finalized.
