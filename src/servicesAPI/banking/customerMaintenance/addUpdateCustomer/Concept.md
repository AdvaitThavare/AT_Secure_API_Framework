Consolidated Technical Validation Rules — addUpdateCustomer
This is the consolidated contract based on our decisions so far. It covers the validation sequence, request-field rules, conditional logic, error handling, and persistence semantics. We can use it as the reference when we move to coding logic.

1. Overall validation sequence

### 1

Framework request parsing

Parse according to the declared media type. Parsing failures are handled by the existing framework pipeline.

### 2

Media-type check — `<span>415</span>`

Reject unsupported media types before API-level validation.

### 3

Customer identity check — `<span>403</span>`

When a nonempty string `<span>customerId</span>` is supplied, compare it with the authenticated username. On mismatch, stop immediately, before unknown-field checks, deeper validation, functional validation, or database writes.

### 4

Unknown-field check — `<span>400</span>`

Reject undeclared fields at both request levels.

### 5

`<span>dataTypeCheck</span>` — `<span>400</span>`

Validate the types of supplied values.

### 6

`<span>dataFormatCheck</span>` — `<span>400</span>`

Validate nullability treatment, field formats, and allowed values.

### 7

`<span>conditionalDataCheck</span>` — `<span>400</span>`

Enforce required fields and action-dependent field relationships.

General rules

- Stop on the first validation error.
- Unknown fields take priority over type and format checks.
- Validation errors generally return HTTP 400 with error code BAD_REQUEST.
- Missing, null, empty-string, and whitespace-only values count as empty for mandatory-field checks.
- Do not trim, uppercase, or otherwise transform nonempty input values silently.
- The normal framework request parser already ensures that a successfully parsed JSON payload is a top-level object. The technical validator should continue relying on that framework contract rather than duplicating the check.
- Database lookups and persisted-state checks belong in addUpdateCustomerFunctionalValidator.ts, not dataFormatCheck.

2. Request-field and data-type contract
   The supported request fields are:
   {
   "customerId": "...",
   "customerFirstName": "...",
   "customerLastName": "...",
   "customerMobileNo": "...",
   "customerPAN": "...",
   "customerGender": "...",
   "account": {
   "debitAccountNo": "...",
   "ifscCode": "...",
   "accountType": "...",
   "openOrLinkAccount": "..."
   },
   "action": "..."
   }

Field	Expected data type	Empty values at format stage?
customerId	String	Accepted; mandatory check follows
customerFirstName	String	Accepted; action rules determine requiredness
customerLastName	String	Accepted; action rules determine requiredness
customerMobileNo	String	Accepted; action rules determine requiredness
customerPAN	String	Accepted; mandatory check follows
customerGender	String	Accepted; optional
account	Object	null treated as empty
account.debitAccountNo	String	Accepted; conditional rules apply
account.ifscCode	String	Accepted; conditional rules apply
account.accountType	String	Accepted; conditional rules apply
account.openOrLinkAccount	String	Accepted; conditional rules apply
action	String	Accepted; mandatory check follows
For dataTypeCheck, a non-null value must have its declared type. For example, a numeric customerMobileNo fails the type check; the string "123" reaches the format check and fails its mobile-number rules.
3. Field-specific format rules
3.1 customerFirstName and customerLastName
Each field is validated independently.

- Length: 3–25 characters, including any permitted hyphens or apostrophes.
- Permitted characters: English letters A–Z, a–z, hyphens (-), and apostrophes (').
- No spaces within either field.
- No leading or trailing hyphens or apostrophes.
- Reject consecutive separators, including --, '', -', and '-.
- At least one alphabetic character must be present; a separator-only value is invalid.
  Examples:
  Value	Result
  Advait	Pass
  Thavare	Pass
  Anne-Marie	Pass
  O'Neill	Pass
  -Advait	Fail
  Advait-	Fail
  Anne--Marie	Fail
  Ad	Fail — too short
  Advait Thavare	Fail — spaces are not permitted within a field
  3.2 customerMobileNo
- Exactly 10 digits.
- First digit must be 6, 7, 8, or 9.
- No spaces, hyphens, or +91 prefix.
  Pattern:
  ^[6-9][0-9]{9}$

3.3 customerPAN

- Exactly 10 characters: five letters, four digits, and one final letter.
- Uppercase letters only.
- Fourth character must be P.
- Fifth character must match the first letter of customerLastName, comparing without case sensitivity on the surname's first letter.
- We validate the defined format only. We do not verify PAN issuance or authenticity because the service uses dummy PANs.
  Combined pattern for the structural format and individual-holder code:
  ^[A-Z]{3}P[A-Z][0-9]{4}[A-Z]$

The surname comparison is an additional check beyond this pattern.
3.4 account.debitAccountNo

- String containing digits only.
- Minimum length: 9.
- Maximum length: 18.
- Leading zeros are permitted.
- Generated account numbers must be exactly 16 digits.
  The 16-digit rule applies to our generation logic, not to the general field-level format check.
  3.5 account.ifscCode
- Exactly 11 characters.
- First four characters must be uppercase letters.
- Fifth character must be 0.
- Final six characters must be uppercase letters or digits.
- Structural validation only; no verification that the code is actually assigned to a branch.
  Pattern:
  ^[A-Z]{4}0[A-Z0-9]{6}$

3.6 Allowed values
Field	Allowed values
action	CREATE, UPDATE
account.accountType	SAVINGS, CURRENT
account.openOrLinkAccount	YES, NO
Values must match exactly, including case. Do not automatically uppercase or correct them.
A nonempty unsupported value fails dataFormatCheck. If the value is empty or missing, conditionalDataCheck determines whether the field is mandatory.
4. conditionalDataCheck — top-level rules
Field	CREATE	UPDATE
action	Mandatory	Mandatory
customerId	Mandatory	Mandatory
customerFirstName	Mandatory	Optional
customerLastName	Mandatory	Optional
customerMobileNo	Mandatory	Optional
customerPAN	Mandatory	Mandatory
customerGender	Optional	Optional
account	Mandatory	Optional
For mandatory fields, missing, null, blank, and whitespace-only values produce the same required-field error.
Identity and persisted-state checks
These should remain separate from the purely structural technical validation:

- customerId in the request must match the Basic Auth username. A mismatch returns HTTP 403 Forbidden.
- For CREATE, the supplied customer ID and PAN are written to the database only after the appropriate checks succeed; creation must be rejected if the customer already exists.
- For UPDATE, the customer ID and PAN must match the existing customer record according to the agreed functional validation rules.
- On UPDATE, customerLastName can be omitted. If it is supplied, validate its relationship to the supplied PAN. If omitted, the stored surname may be needed for the PAN comparison.
- No-op updates are allowed. The service can return "No new values provided; record remains unchanged." without executing a database write.
  The Basic Auth comparison should happen before any database mutation. Whether the 403 identity check runs before or after technical validation determines error precedence if a request is both malformed and has a mismatched customer ID; we should settle that in the service orchestration discussion.

5. conditionalDataCheck — account rules
   CREATE

- account is mandatory.
- account.accountType is mandatory.
- account.openOrLinkAccount must be YES.
- If both debitAccountNo and ifscCode are nonempty, the request follows the account-linking flow.
- If both are empty, the service generates an account number and selects the IFSC for the account-opening flow.
- If exactly one is nonempty, reject the request with Account Details missing.
  UPDATE
- An absent or null account object means no account operation.
- An empty account object means no account operation.
- openOrLinkAccount: "NO" means no account operation.
- When openOrLinkAccount is YES, accountType is mandatory.
- When both debitAccountNo and ifscCode are nonempty, link the specified account.
- When both are empty, open a new account using the service's generation logic.
- When exactly one is nonempty, reject with Account Details missing.
- Nonempty account-operation fields supplied alongside openOrLinkAccount: "NO" must not be silently ignored; the conditional validator should reject the conflicting combination.
  These rules assume that account number and IFSC together distinguish linking an account from generating a new one when an account operation has been requested.

6. Persistence behavior
   The DAL functions have distinct contracts.
   createCustomer()

- Required empty values should already have been rejected.
- For applicable optional fields, missing, null, blank, or whitespace-only values are persisted as SQL NULL.
- Nonempty values are persisted after validation.
- Related inserts should remain transactional.
  updateCustomer()
- Empty fields are ignored.
- Existing values are preserved when their corresponding request fields are empty.
- Only explicitly permitted, nonempty fields are updated.
- If nothing is being changed, the service returns the agreed no-op success response and avoids an empty SQL update.
- An empty value cannot clear an existing field. Clearing a field would require an explicit operation defined by a future contract.
  Database constraints remain a final integrity safeguard; request validation and functional validation are the normal control points.

7. Error handling summary
   Failure	Expected response
   Unsupported media type	415 UNSUPPORTED_CONTENT_TYPE
   Unknown field	400 BAD_REQUEST
   Incorrect data type	400 BAD_REQUEST
   Invalid nonempty format or allowed value	400 BAD_REQUEST
   Required field empty for the selected action	400 BAD_REQUEST, with the same required-field error regardless of missing, null, or blank
   Only one of debit account number and IFSC supplied	400 BAD_REQUEST, Account Details missing
   Request customerId differs from Basic Auth username	403 Forbidden
   No update values supplied	Success response; no database write
   The validator must stop at the first error. The ordering above determines which error takes precedence.
8. Agreed boundaries before coding
   At this point, the design separates four concerns:
9. Unknown fields and data types — schema-driven checks.
10. Field formats and allowed values — declarative constraints plus dedicated functions where useful.
11. Conditional request rules — action-dependent mandatory fields and field relationships.
12. Authentication, persisted-state checks, and writes — service orchestration, functional validation, and the relevant DAL function.
    One technical note to carry into the coding discussion: customerId versus Basic Auth username is an identity/authorization check, not an intrinsic field-format check. Likewise, matching PAN and customer ID against existing database values belongs in functional validation, not the technical validator.
    This is the baseline contract we can now use to discuss the implementation structure and execution logic before writing the validator.
