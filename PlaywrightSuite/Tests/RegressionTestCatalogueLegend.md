# Regression Test Case Catalogue

This catalogue lists the current regression test cases planned for the framework.
Detailed testing scope, rationale, architecture, and regression principles are maintained separately in `RegressionBaseline.md`.

## Category Codes

| Code  | Category                 |
| ----- | ------------------------ |
| `TLS` | Transport Layer          |
| `RTE` | Routing Layer            |
| `PLN` | Plain API Flows          |
| `CRY` | Client Cryptography APIs |
| `ENC` | Encrypted E2E Flows      |

## Type Codes

| Code  | Type                                                |
| ----- | --------------------------------------------------- |
| `POS` | Positive / expected successful behavior             |
| `NEG` | Negative / expected rejection or controlled failure |

## Status

| Status            | Meaning                                       |
| ----------------- | --------------------------------------------- |
| `Not Implemented` | Test case identified but test not yet written |
| `Implemented`     | Test written and passing                      |
| `Skipped`         | Intentionally not executed                    |
| `Retired`         | No longer applicable to the framework         |

---

## Current Baseline Summary

| Category        | Positive | Negative |  Total |
| --------------- | -------: | -------: | -----: |
| Transport Layer |        0 |        4 |      4 |
| Routing Layer   |        0 |        9 |      9 |
| Plain           |        4 |        7 |     11 |
| Client Crypto   |        0 |       12 |     12 |
| Encrypted       |        3 |        6 |      9 |
| **Total**       |    **7** |   **38** | **45** |
