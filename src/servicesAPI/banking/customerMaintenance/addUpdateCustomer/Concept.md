
# Add / Update Customer API — Concept

## 1. Purpose

The `addUpdateCustomer` API provides customer creation and maintenance functionality for the banking framework.

It supports two operations:

- `CREATE` — Register a new customer and create or link an account.
- `UPDATE` — Modify an existing customer's details and optionally create or link an additional account.

The API follows the framework's API-first architecture and separates request validation, business validation, data access, and response construction.

## 2. API Contract

The API accepts JSON requests and supports both `PLAIN` and `ENCRYPTED` framework payload flows.

### 2.1 Request Structure

```json
{
  "action": "CREATE",
  "customerId": "atecho",
  "customerFirstName": "Advait",
  "customerLastName": "Thavare",
  "customerMobileNo": "9876543210",
  "customerPAN": "ABCDE1234F",
  "customerGender": "MALE",
  "account": {
    "accountType": 1,
    "openOrLinkAccount": "YES"
  }
}
```

### 2.2 Customer Fields

| Field                 | Requirement | Description                                                       |
| --------------------- | ----------- | ----------------------------------------------------------------- |
| `action`            | Mandatory   | `CREATE` or `UPDATE`                                          |
| `customerId`        | Mandatory   | Customer identifier; must match the Basic Authentication username |
| `customerFirstName` | Conditional | Customer's first name                                             |
| `customerLastName`  | Conditional | Customer's last name                                              |
| `customerMobileNo`  | Conditional | Indian mobile number                                              |
| `customerPAN`       | Mandatory   | Customer PAN                                                      |
| `customerGender`    | Optional    | Customer gender                                                   |

Customer names are maintained as separate first-name and last-name fields. Spaces are not accepted within either field; hyphens and apostrophes are permitted.

### 2.3 Account Fields

| Field                 | Requirement | Description                                |
| --------------------- | ----------- | ------------------------------------------ |
| `debitAccountNo`    | Conditional | Existing debit account number to link      |
| `ifscCode`          | Conditional | IFSC corresponding to the supplied account |
| `accountType`       | Conditional | `1` = SAVINGS, `2` = CURRENT           |
| `openOrLinkAccount` | Conditional | `YES` or `NO`                          |

The API accepts numeric account-type identifiers. Their corresponding descriptions are maintained internally through the account-type reference table.

## 3. Authentication and Customer Identity

The API uses Basic Authentication.

The supplied customer identifier must match the authenticated username.

This ensures that a client can only create or update the customer record associated with its authenticated identity.

A mismatch is rejected with HTTP `403` and error code `CUSTOMER_ID_MISMATCH`.

The API also verifies the supplied credentials against its configured client definition.

## 4. Technical Validation

Technical validation is responsible for establishing that the incoming request conforms to the API contract.

It does not perform database-dependent business checks.

The validation process includes:

1. Request media-type validation. Only `application/json` is accepted.
2. Customer identity validation against the authenticated username.
3. Unknown-field detection.
4. Data-type validation.
5. Data-format validation.
6. Conditional field validation.

### 4.1 Data Format Rules

| Field                 | Validation                                                           |
| --------------------- | -------------------------------------------------------------------- |
| `customerFirstName` | Alphabetic name; hyphens and apostrophes permitted; 3–25 characters |
| `customerLastName`  | Alphabetic name; hyphens and apostrophes permitted; 3–25 characters |
| `customerMobileNo`  | Exactly 10 digits, starting with 6–9                                |
| `customerPAN`       | Ten-character PAN format; fourth character must be `P`             |
| `debitAccountNo`    | Numeric, 9–18 digits                                                |
| `ifscCode`          | Eleven-character IFSC format                                         |
| `accountType`       | Integer value `1` or `2`                                         |

PAN validation checks the prescribed format. It does not compare the final PAN character against the customer's surname initial.

Empty and whitespace-only values are treated as empty for conditional required-field checks.

### 4.2 Validation Errors

| Condition                                                          | HTTP status | Error code                   |
| ------------------------------------------------------------------ | ----------: | ---------------------------- |
| Customer ID does not match authenticated username                  |         403 | `CUSTOMER_ID_MISMATCH`     |
| Unsupported media type                                             |         415 | `UNSUPPORTED_CONTENT_TYPE` |
| Invalid request structure, data type, format or conditional fields |         400 | `BAD_REQUEST`              |

## 5. Functional Validation

Functional validation performs database-dependent checks after successful technical validation.

It is responsible for verifying customer existence, customer identity and account-related business rules.

### 5.1 Customer Validation

**CREATE**

- The customer must not already exist.
- The customer identifier must be available.
- The supplied customer details must satisfy the creation requirements.

**UPDATE**

- The customer must already exist.
- The supplied PAN must match the PAN stored for that customer.
- A PAN mismatch is rejected with HTTP `403` and error code `CUSTOMER_IDENTITY_MISMATCH`.

The functional validator performs customer checks before account checks.

### 5.2 Account Validation

Account processing depends on the requested action and the `openOrLinkAccount` value.

#### CREATE

- An account object is mandatory.
- `accountType` is mandatory.
- `openOrLinkAccount` must be `YES`.
- If both `debitAccountNo` and `ifscCode` are supplied, the external account is linked.
- If both are omitted, an internal account is generated.
- Supplying only one of the two account-identification fields is rejected during technical validation.

#### UPDATE

The account object itself is optional.

If the account object is supplied, `openOrLinkAccount` is required.

| `openOrLinkAccount` | Account details                             | Behavior                          |
| --------------------- | ------------------------------------------- | --------------------------------- |
| `NO`                | Supplied or omitted                         | No account operation is performed |
| `YES`               | Both debit account number and IFSC supplied | Link the external account         |
| `YES`               | Both debit account number and IFSC omitted  | Generate an internal account      |
| `YES`               | Only one supplied                           | Reject the request                |

When `openOrLinkAccount` is `YES`, `accountType` is mandatory.

An UPDATE with `openOrLinkAccount: NO` does not modify or insert account information, even if account-related fields are also supplied.

### 5.3 Account Uniqueness

Two independent uniqueness checks are performed:

**Debit account number + IFSC**

The combination must not already exist in the customer account table.

**Customer + IFSC + account type**

A customer may maintain one account of each type for a given IFSC.

For example, the same customer may have one SAVINGS and one CURRENT account for the same IFSC, but cannot have two SAVINGS accounts for that IFSC.

Both internal account generation and external account linking pass through the common debit-account/IFSC uniqueness check.

## 6. Internal Account Generation

Internal account generation is performed in the functional validation layer.

The generated debit account number follows a fixed 16-digit structure:

| Digits | Description             | Value              |
| ------ | ----------------------- | ------------------ |
| 1–4   | Bank / Branch code      | `0001`           |
| 5–8   | Branch / Location code  | `5555`           |
| 9–15  | Random numeric sequence | Generated randomly |
| 16     | Random final digit      | Generated randomly |

The internal IFSC is:

`ATFW0000055`

The account number is generated using cryptographically secure random digit generation.

Before accepting a generated number, the functional validator checks whether the debit-account-number and IFSC combination already exists.

If a collision occurs, another account number is generated and checked.

The database's unique index provides the final safeguard against duplicate combinations.

The random-generation approach avoids depending on a database-maintained sequential account-number counter.

## 7. Data Access Layer

The Customer DAL is responsible for customer and account persistence.

It provides the following principal operations:

- `createCustomer()`
- `updateCustomer()`
- `fetchCustomer()`
- `accountCombinationExists()`
- `customerAccountTypeExists()`

### 7.1 CREATE

Customer creation and account insertion are performed within a single database transaction.

The transaction either commits both operations or rolls back if either operation fails.

### 7.2 UPDATE

Customer details are updated only when corresponding values are provided.

Account insertion is performed only when the service supplies account details for an account operation.

The DAL does not repeat technical or functional validation already completed by the service and validators.

### 7.3 Customer Retrieval

`fetchCustomer()` retrieves the customer record and its associated accounts.

The response includes descriptive values for customer status, account type and account status.

## 8. Database Design

The main customer and account tables store descriptive reference values rather than their numeric reference keys.

### 8.1 Customer Details

`customer_Details` stores:

- Customer identifier
- First name
- Last name
- Mobile number
- PAN
- Gender
- Customer status description

The customer identifier, mobile number and PAN are unique.

### 8.2 Customer Account Details

`customer_Account_Details` stores:

- Serial number
- Customer identifier
- Debit account number
- IFSC
- Account type description
- Account balance
- Account status description

The following uniqueness constraints apply:

- `UNIQUE(debitAccountNo, ifscCode)`
- `UNIQUE(customerId, ifscCode, accountType)`

### 8.3 Reference Tables

The reference tables retain numeric keys and their descriptions.

| Reference table     | Example descriptions              |
| ------------------- | --------------------------------- |
| `customer_Status` | ACTIVE, INACTIVE                  |
| `account_Type`    | SAVINGS, CURRENT                  |
| `account_Status`  | ACTIVE, INACTIVE, CLOSED, BLOCKED |

Foreign keys in the main tables reference the corresponding unique description columns.

This allows the main customer and account tables to store readable values while retaining referential integrity.

### 8.4 Initial Account Balance

Newly created or linked accounts receive an initial balance of:

`10000`

New customer and account records are initially assigned the `ACTIVE` status.

## 9. DAL Error Handling

The DAL identifies known database conflicts through the `CustomerDALError` class.

The database error mapper translates SQLite primary-key and unique-constraint violations into specific DAL error codes.

| DAL error code                     | Meaning                                       |
| ---------------------------------- | --------------------------------------------- |
| `CUSTOMER_ALREADY_EXISTS`        | Customer identifier already exists            |
| `CUSTOMER_MOBILE_ALREADY_EXISTS` | Mobile number already exists                  |
| `CUSTOMER_PAN_ALREADY_EXISTS`    | PAN already exists                            |
| `DUPLICATE_ACCOUNT_COMBINATION`  | Debit account number + IFSC already exists    |
| `ACCOUNT_TYPE_ALREADY_EXISTS`    | Customer + IFSC + account type already exists |
| `CUSTOMER_NOT_FOUND`             | Customer does not exist during UPDATE         |

Unexpected database errors are not converted into business errors. They propagate to the service layer for generic error handling.

## 10. API Response Handling

The service layer translates DAL errors into HTTP responses.

| Error                                   | HTTP status |
| --------------------------------------- | ----------: |
| `CUSTOMER_ALREADY_EXISTS`             |         409 |
| `CUSTOMER_MOBILE_ALREADY_EXISTS`      |         409 |
| `CUSTOMER_PAN_ALREADY_EXISTS`         |         409 |
| `DUPLICATE_ACCOUNT_COMBINATION`       |         409 |
| `ACCOUNT_TYPE_ALREADY_EXISTS`         |         409 |
| `CUSTOMER_NOT_FOUND`                  |         404 |
| Unexpected customer-maintenance failure |         500 |

Successful responses:

- CREATE returns HTTP `201`.
- UPDATE returns HTTP `200`.
- A no-op UPDATE returns HTTP `200` with the message:

  `No new values provided; record remains unchanged.`

The no-op response is returned when no nonempty customer fields are supplied and no account operation is requested.

Customer existence and PAN identity checks still take place before a no-op response is returned.

## 11. Processing Flow

The overall processing sequence is:

1. Extract Basic Authentication credentials.
2. Validate the configured client credentials.
3. Perform technical validation.
4. Perform functional validation.
5. Use the validated context returned by functional validation.
6. Execute the requested CREATE or UPDATE operation through the Customer DAL.
7. Retrieve the updated customer record using `fetchCustomer()`.
8. Construct and return the API response.

Known DAL errors are translated into specific HTTP responses. Unexpected exceptions are returned as generic customer-maintenance failures.

## 12. Design Principles

The implementation follows these principles:

- **Separation of responsibilities:** Technical validation, functional validation, persistence and response handling remain separate.
- **API-first contract:** External request values are validated before reaching the DAL.
- **Strong typing:** Validated payload types represent the contract after technical validation.
- **Transactional persistence:** Customer and account creation or updates are protected by database transactions.
- **Database-enforced integrity:** Unique indexes and foreign keys provide final data-integrity safeguards.
- **Readable persistence values:** Main tables store reference descriptions, while reference tables retain their numeric keys.
- **No redundant validation:** The DAL relies on the validation layers for request correctness.
- **Explicit account operations:** Account linking and internal account generation occur only when requested by the API contract.
