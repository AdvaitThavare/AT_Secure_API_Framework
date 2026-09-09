# Regression Test Case Catalogue

## AT_Secure_API_Framework — Current Framework Baseline

### Purpose

This catalogue defines the initial automated E2E regression scope for the framework in its current state.

The suite is intended to verify externally observable framework behavior through real HTTPS/mTLS API calls. Tests should not import internal framework functions or duplicate cryptographic implementations.

The catalogue is deliberately based on the framework's **current capabilities**. Future capabilities such as API Gateway / Flow Validation, authentication, subscriptions, persistence, multiple client identities, and additional APIs will be added or reorganized later without changing the purpose of the existing tests.

---

# Test ID Convention

Each test case receives a stable identifier.

Format:

`<CATEGORY>-<TYPE>-<NUMBER>`

Examples:

* `TLS-NEG-001`
* `RTE-NEG-001`
* `PLN-POS-001`
* `PLN-NEG-001`
* `CRY-NEG-001`
* `ENC-POS-001`
* `ENC-NEG-001`

### Category Codes

| Code  | Category                 |
| ----- | ------------------------ |
| `TLS` | Transport Layer          |
| `RTE` | Routing Layer            |
| `PLN` | Plain API flows          |
| `CRY` | Client Cryptography APIs |
| `ENC` | Encrypted E2E flows      |

### Type Codes

| Code  | Meaning                                             |
| ----- | --------------------------------------------------- |
| `POS` | Positive / expected successful behavior             |
| `NEG` | Negative / expected rejection or controlled failure |

Transport and Routing currently contain negative tests only.

---

# 1. Transport Layer

## Folder

`Tests/TransportLayer/Negative/`

## Purpose

Verify failures at the HTTPS / mTLS transport boundary before an application request can be successfully processed.

These tests do not test API business behavior.

A successful transport connection is already exercised by the Plain, ClientCrypto, and Encrypted E2E tests.

### TLS-NEG-001 — Missing Client Certificate

**Scenario**

Attempt to access the HTTPS server without presenting the required client certificate.

**Expected**

The TLS connection is rejected.

The request must not reach normal application-level request processing.

**Primary regression risk**

Accidentally disabling client-certificate enforcement.

---

### TLS-NEG-002 — Invalid Client Certificate

**Scenario**

Present a client certificate that is not trusted by the server's configured CA.

**Expected**

The TLS connection is rejected.

**Primary regression risk**

Incorrect trust-chain configuration or accidental acceptance of unauthorized client identities.

---

### TLS-NEG-003 — Invalid Client Private Key / Certificate Pair

**Scenario**

Present a client certificate with a private key that does not belong to that certificate.

**Expected**

The TLS client authentication attempt fails.

**Primary regression risk**

Transport setup accepting an invalid client identity configuration.

---

### TLS-NEG-004 — Invalid Server Hostname

**Scenario**

Connect using a hostname that does not satisfy the server certificate / configured TLS expectations.

**Expected**

The connection is rejected when server certificate verification is enabled for this test.

**Primary regression risk**

Unexpected hostname/certificate validation behavior.

**Note**

This test will require a transport-specific Playwright context because the normal regression `apiContext` currently uses `ignoreHTTPSErrors: true`.

---

# 2. Routing Layer

## Folder

`Tests/RoutingLayer/Negative/`

## Purpose

Verify that requests are rejected when the framework cannot legitimately route or classify them.

These tests concern endpoint, method, and required routing metadata.

They do not test service-specific business validation.

---

### RTE-NEG-001 — Unsupported HTTP Method

**Scenario**

Invoke a known endpoint using an HTTP method that the endpoint does not support.

Example:

`GET /echo` when the endpoint expects `POST`.

**Expected**

Request is rejected according to the framework's current method-validation contract.

**Primary regression risk**

Incorrect or missing HTTP method validation.

---

### RTE-NEG-002 — Unknown Endpoint

**Scenario**

Invoke an endpoint that does not exist.

Example:

`POST /doesNotExist`

**Expected**

Request is rejected according to the framework's current endpoint-routing contract.

**Primary regression risk**

Requests being dispatched despite missing endpoint registration.

---

### RTE-NEG-003 — Missing Payload State Header

**Scenario**

Send an otherwise valid request without:

`x-payload-state`

**Expected**

Request is rejected as an invalid framework request.

**Primary regression risk**

Payload processing occurring without a declared payload state.

---

### RTE-NEG-004 — Missing Data Encryption Header

**Scenario**

Send an otherwise valid request without:

`x-data-encryption`

**Expected**

Request is rejected.

**Primary regression risk**

Framework processing an unspecified encryption mode.

---

### RTE-NEG-005 — Missing Encryption Wrapper Content-Type Header

**Scenario**

Send a request without:

`x-enc-wrapper-content-type`

**Expected**

Request is rejected according to the framework's current header requirements.

**Primary regression risk**

Incorrect encrypted/plain wrapper classification.

---

### RTE-NEG-006 — Invalid Payload State Value

**Scenario**

Provide an unsupported value for:

`x-payload-state`

Example:

`x-payload-state: INVALID`

**Expected**

Request is rejected.

**Primary regression risk**

Unknown payload states being accepted.

---

### RTE-NEG-007 — Invalid Data Encryption Value

**Scenario**

Provide an unsupported value for:

`x-data-encryption`

**Expected**

Request is rejected.

**Primary regression risk**

Unknown encryption strategies entering the processing pipeline.

---

### RTE-NEG-008 — Invalid Encryption Wrapper Content-Type Value

**Scenario**

Provide an unsupported value for:

`x-enc-wrapper-content-type`

**Expected**

Request is rejected.

**Primary regression risk**

Invalid wrapper metadata reaching later processing stages.

---

### RTE-NEG-009 — Invalid Framework Header Combination

**Scenario**

Send mutually incompatible framework metadata.

Examples should be selected from combinations that the current framework already considers invalid.

**Expected**

Request is rejected.

**Primary regression risk**

Framework making an incorrect processing decision because individual headers are valid but their combination is not.

---

# 3. Plain API Flows

## Folder

`Tests/Plain/`

```text
Plain/
├── Positive/
└── Negative/
```

## Purpose

Verify successful Plain requests and generic Plain payload handling rules.

---

# 3A. Plain Positive

## `Tests/Plain/Positive/`

### PLN-POS-001 — Simple JSON Object

**Scenario**

Send a valid JSON object to `/echo`.

Example:

```json
{
  "name": "Advait"
}
```

**Expected**

* HTTP 200
* expected response Content-Type
* `responseStatus.success = true`
* response payload equals the original object

**Status**

Implemented as the current pilot test.

---

### PLN-POS-002 — Nested JSON Object

**Scenario**

Send a valid nested JSON object.

Example structure:

```json
{
  "customer": {
    "name": "Advait",
    "address": {
      "city": "Mumbai"
    }
  }
}
```

**Expected**

The nested structure is preserved through the E2E request/response flow.

**Primary regression risk**

Changes to parsing, serialization, or echo handling that alter nested structures.

---

### PLN-POS-003 — Plain Text

**Scenario**

Send a valid `text/plain` request.

Example:

`Hello Advait`

**Expected**

* HTTP 200
* response indicates successful processing
* returned payload is the expected plain text representation

**Primary regression risk**

Breaking support for Plain text while maintaining JSON functionality.

---

### PLN-POS-004 — Plain Text Containing JSON-Like Content

**Scenario**

Send a `text/plain` value that visually resembles JSON.

Examples:

`null`

`123`

`[A,B]`

**Expected**

The content remains plain text and is not interpreted as JSON.

**Primary regression risk**

Incorrectly parsing Plain text as JSON.

---

# 3B. Plain Negative

## `Tests/Plain/Negative/`

### PLN-NEG-001 — Malformed JSON

**Scenario**

Send malformed JSON with:

`Content-Type: application/json`

Example:

```text
{"name":"Advait"
```

**Expected**

Request is rejected with the framework's generic invalid-payload/error contract.

**Primary regression risk**

Malformed payload reaching the service or causing uncontrolled processing failure.

---

### PLN-NEG-002 — Top-Level JSON Array

**Scenario**

Send:

```json
[
  "A",
  "B"
]
```

with:

`Content-Type: application/json`

**Expected**

Request is rejected because the framework requires a top-level JSON object.

**Primary regression risk**

Regression in the JSON representation rule.

---

### PLN-NEG-003 — Top-Level JSON Null

**Scenario**

Send:

```json
null
```

with:

`Content-Type: application/json`

**Expected**

Request is rejected.

**Primary regression risk**

`null` bypassing parser validation and reaching service logic.

---

### PLN-NEG-004 — Top-Level JSON Primitive

**Scenario**

Send a top-level JSON primitive.

Representative example:

```json
123
```

**Expected**

Request is rejected because `application/json` requires a top-level object.

One representative primitive case is sufficient initially; we do not need separate tests for string, number, and boolean unless their behavior diverges.

---

### PLN-NEG-005 — JSON Content-Type with Non-JSON Body

**Scenario**

Send:

`Content-Type: application/json`

with a body such as:

`Hello Advait`

**Expected**

Request is rejected.

**Primary regression risk**

Content-Type and payload interpretation becoming inconsistent.

---

### PLN-NEG-006 — Unsupported Content Type

**Scenario**

Send a request using an unsupported media type.

Example:

`Content-Type: application/xml`

**Expected**

Request is rejected according to the framework's current unsupported-media-type behavior.

---

### PLN-NEG-007 — Empty Request Body

**Scenario**

Send a Plain JSON request with no request body.

**Expected**

Request is rejected if the current parser treats an empty JSON body as invalid.

**Primary regression risk**

Empty payload bypassing request validation.

**Note**

Exact expected status/error should be captured from the current framework when implementing the case.

---

# 4. Client Cryptography APIs

## Folder

`Tests/ClientCrypto/`

```text
ClientCrypto/
└── Negative/
```

## Purpose

Validate controlled failures of the framework's client-side cryptography APIs.

The current baseline focuses on negative behavior because the successful operation of these APIs will also be exercised as part of the complete encrypted E2E journeys.

The tests must not duplicate cryptographic implementation inside the regression suite.

---

## JWE

### CRY-NEG-001 — JWE Encrypt Invalid Input

**Scenario**

Call:

`/clientCryptography/encryptJWE`

with invalid input that violates the service's expected request structure.

**Expected**

Controlled validation failure.

---

### CRY-NEG-002 — JWE Decrypt Malformed JWE

**Scenario**

Call:

`/clientCryptography/decryptJWE`

with a malformed compact JWE value.

**Expected**

Controlled cryptographic/service failure rather than an uncontrolled server error.

---

### CRY-NEG-003 — JWE Decrypt Invalid Cryptographic Content

**Scenario**

Provide a structurally valid-looking JWE whose cryptographic content cannot be successfully decrypted.

**Expected**

Controlled failure.

---

## AES_RSA

### CRY-NEG-004 — AES_RSA Decrypt Missing Payload

**Scenario**

Omit the encrypted payload field.

**Expected**

Controlled validation failure.

---

### CRY-NEG-005 — AES_RSA Decrypt Missing Encrypted Key

**Scenario**

Omit the encrypted AES key.

**Expected**

Controlled validation failure.

---

### CRY-NEG-006 — AES_RSA Decrypt Missing IV

**Scenario**

Omit `base64iv`.

**Expected**

Controlled validation failure.

---

### CRY-NEG-007 — AES_RSA Decrypt Invalid Encrypted Data

**Scenario**

Provide invalid/corrupted encrypted payload, key, or IV.

**Expected**

Controlled cryptographic failure.

---

## JWS_AES_RSA

### CRY-NEG-008 — JWS_AES_RSA Decrypt Missing Payload

**Scenario**

Omit encrypted payload.

**Expected**

Controlled validation failure.

---

### CRY-NEG-009 — JWS_AES_RSA Decrypt Missing Encrypted Key

**Scenario**

Omit encrypted AES key.

**Expected**

Controlled validation failure.

---

### CRY-NEG-010 — JWS_AES_RSA Decrypt Missing IV

**Scenario**

Omit `base64iv`.

**Expected**

Controlled validation failure.

---

### CRY-NEG-011 — JWS_AES_RSA Invalid JWS Signature

**Scenario**

Provide an otherwise processable JWS with an invalid signature.

**Expected**

Signature verification fails and the API returns a controlled failure.

**Primary regression risk**

Signature verification being bypassed or verification failures being mishandled.

---

### CRY-NEG-012 — JWS_AES_RSA Invalid Cryptographic Content

**Scenario**

Provide corrupted encrypted payload/key/IV or another cryptographically invalid combination.

**Expected**

Controlled failure.

---

# 5. Encrypted E2E Flows

## Folder

`Tests/Encrypted/`

```text
Encrypted/
├── Positive/
└── Negative/
```

## Purpose

These tests verify the complete encrypted framework journey rather than only individual crypto operations.

The general pattern is:

```text
Original Payload
      ↓
Client Encryption API
      ↓
Encrypted Request
      ↓
/echo encrypted flow
      ↓
Encrypted Response
      ↓
Client Decryption API
      ↓
Recovered Payload
```

These are the most important security regression tests.

---

# 5A. Encrypted Positive

## `Tests/Encrypted/Positive/`

### ENC-POS-001 — JWE Echo Round Trip

**Scenario**

1. Start with a known original JSON payload.
2. Encrypt it using `/clientCryptography/encryptJWE`.
3. Use the encrypted result to call the encrypted `/echo` flow.
4. Receive the encrypted response.
5. Decrypt using `/clientCryptography/decryptJWE`.
6. Compare the recovered payload with the original payload.

**Expected**

Recovered payload exactly matches the original payload.

**Primary regression risk**

Any break in the complete JWE integration chain.

---

### ENC-POS-002 — AES_RSA Echo Round Trip

Same overall journey using:

`AES_RSA`

**Expected**

Recovered payload exactly matches the original payload.

---

### ENC-POS-003 — JWS_AES_RSA Echo Round Trip

Same overall journey using:

`JWS_AES_RSA`

**Expected**

Recovered payload exactly matches the original payload and the JWS signature is successfully verified as part of decryption.

---

# 5B. Encrypted Negative

## `Tests/Encrypted/Negative/`

### ENC-NEG-001 — Invalid Encrypted Wrapper

**Scenario**

Send an encrypted request whose wrapper structure is invalid.

**Expected**

Request is rejected before successful encrypted service processing.

---

### ENC-NEG-002 — Corrupted Ciphertext

**Scenario**

Take a valid encrypted request and alter its encrypted payload before sending it to the encrypted API.

**Expected**

Controlled cryptographic failure.

**Primary regression risk**

Tampered ciphertext being incorrectly accepted or causing an uncontrolled failure.

---

### ENC-NEG-003 — Invalid Encryption Metadata

**Scenario**

Use an encrypted payload but declare incorrect encryption metadata.

Example:

Encrypted with one strategy but declare another.

**Expected**

Request is rejected or fails in a controlled manner according to the current framework behavior.

---

### ENC-NEG-004 — Invalid Encrypted Key

**Scenario**

Use a valid encrypted payload but corrupt or replace the encrypted key.

**Expected**

Controlled cryptographic failure.

---

### ENC-NEG-005 — Invalid IV

**Scenario**

Use invalid/corrupted IV information.

**Expected**

Controlled failure.

---

### ENC-NEG-006 — JWS Signature Verification Failure

**Scenario**

Modify the encrypted/JWS content so that the signature no longer matches the payload.

**Expected**

Signature verification fails and the overall encrypted flow is rejected.

---

# 6. Deliberately Excluded from the Current Baseline

The following are **not part of the initial current-state regression catalogue**:

### Future API Flow Validation

Examples:

* `encryptJWE` called with an encrypted flow
* `decryptJWE` called with a Plain flow
* invalid API + payload-state + encryption-type combinations

These should be added once the API Gateway / Flow Validator architecture is implemented.

### Authentication / Authorization

Not currently implemented.

### Client Identity / API Subscription Restrictions

Not currently implemented.

### Persistence / Database behavior

Not currently implemented.

### Multiple Client Certificate Identity Mapping

Not currently implemented.

### Load / Performance / Concurrency Testing

Outside the initial regression scope.

### Internal Unit-Level Tests

The E2E suite should not directly test individual functions such as:

* JSON parser
* AES utility
* RSA utility
* JWS verifier
* service dispatcher function

unless a separate unit-test strategy is introduced later.

---

# 7. Initial Baseline Summary

| Category        | Positive | Negative | Initial Baseline |
| --------------- | -------: | -------: | ---------------: |
| Transport Layer |        0 |        4 |                4 |
| Routing Layer   |        0 |        9 |                9 |
| Plain           |        4 |        7 |               11 |
| ClientCrypto    |        0 |       12 |               12 |
| Encrypted       |        3 |        6 |                9 |
| **Total**       |    **7** |   **38** |           **45** |

The count is intentionally a baseline rather than a requirement that all 45 cases must immediately become separate files.

Where several scenarios protect the same underlying rule, the implementation may use parameterized tests rather than creating many nearly identical test files.

---

# 8. Regression Suite Design Principles

1. Test externally observable behavior rather than internal implementation.

2. Prefer one test per distinct regression risk.

3. Do not duplicate cryptographic implementations in the test suite.

4. For dynamic encrypted values, validate structure and cryptographic behavior rather than exact ciphertext.

5. For complete encrypted E2E tests, validate the recovered payload against the original payload.

6. Negative tests should validate the external error contract:

   * HTTP status
   * error code where applicable
   * response structure
   * response Content-Type where applicable

7. Folder classification should communicate positive/negative intent so the test name itself does not need to carry that information.

8. Future framework features should extend or reorganize this catalogue rather than forcing existing behavioral tests to be rewritten unnecessarily.
