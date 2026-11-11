
import type { DatabaseSync } from 'node:sqlite';
import { randomInt } from 'node:crypto';
import { accountCombinationExists, customerAccountTypeExists, fetchCustomer } from '../../../../DataAccessLayer/customerMaintenance/customerDAL';
import type { AddUpdateCustomerContext, AddUpdateCustomerServiceError, AddUpdateCustomerFunctionalValidationResult } from './addUpdateCustomerTypes';

const INTERNAL_IFSC_CODE = 'ATFW0000055';
const BANK_BRANCH_CODE = '0001';
const LOCATION_CODE = '5555';
const MAX_ACCOUNT_GENERATION_ATTEMPTS = 10;

export function addUpdateCustomerFunctionalValidator(
    database: DatabaseSync,
    context: AddUpdateCustomerContext
): AddUpdateCustomerFunctionalValidationResult {
    const customerDataError = customerDataCheck(database, context);

    if (customerDataError !== null) {
        return {
            valid: false,
            error: customerDataError
        };
    } else {
        const accountDataError = accountDataCheck(database, context);

        if (accountDataError !== null) {
            return {
                valid: false,
                error: accountDataError
            };
        } else {
            return {
                valid: true,
                context
            };
        }
    }
}

function generateAccountNumberCandidate(): string {
    const coreAccountNumber = randomInt(0, 10_000_000)
        .toString()
        .padStart(7, '0');

    const randomSuffix = randomInt(0, 10);

    return `${BANK_BRANCH_CODE}${LOCATION_CODE}${coreAccountNumber}${randomSuffix}`;
}

function customerDataCheck(
    database: DatabaseSync,
    context: AddUpdateCustomerContext
): AddUpdateCustomerServiceError | null {
    const { action, customerId, customerPAN } = context.payload;

    const existingCustomer = fetchCustomer(database, customerId);

    if (action === 'CREATE') {
        if (existingCustomer !== undefined) {
            return {
                statusCode: 409,
                errorCode: 'CUSTOMER_ALREADY_EXISTS',
                message: 'Customer already exists. Only Update action is allowed.'
            };
        }

        // Additional CREATE-specific checks go here.
    }

    if (action === 'UPDATE') {
        if (existingCustomer === undefined) {
            return {
                statusCode: 404,
                errorCode: 'CUSTOMER_NOT_FOUND',
                message: 'Customer does not exist. Only Create action is allowed.'
            };
        }

        if (existingCustomer.customerPAN !== customerPAN) {
            return {
                statusCode: 403,
                errorCode: 'CUSTOMER_IDENTITY_MISMATCH',
                message: 'CustomerID and CustomerPAN do not match the existing customer details.'
            };
        }

        // Additional UPDATE-specific checks go here.
    }

    return null;
}

function accountDataCheck(
    database: DatabaseSync,
    context: AddUpdateCustomerContext
): AddUpdateCustomerServiceError | null {
    const { customerId, account } = context.payload;

    // No account operation requested.
    if (account?.openOrLinkAccount !== 'YES') {
        return null;
    }

    const { debitAccountNo, ifscCode } = account;
    const accountType = account.accountType as 1 | 2;

    const isInternalAccount =
        !debitAccountNo?.trim() && !ifscCode?.trim();

    const accountIFSCCode = isInternalAccount
        ? INTERNAL_IFSC_CODE
        : ifscCode as string;

    let resolvedDebitAccountNo = isInternalAccount
        ? ''
        : debitAccountNo as string;

    let accountCombinationAvailable = false;

    const maxAttempts = isInternalAccount
        ? MAX_ACCOUNT_GENERATION_ATTEMPTS
        : 1;

    // Common account number + IFSC uniqueness check.
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (isInternalAccount) {
            resolvedDebitAccountNo = generateAccountNumberCandidate();
        }

        if (
            !accountCombinationExists(
                database,
                resolvedDebitAccountNo,
                accountIFSCCode
            )
        ) {
            accountCombinationAvailable = true;
            break;
        }
    }

    if (!accountCombinationAvailable) {
        if (isInternalAccount) {
            return {
                statusCode: 500,
                errorCode: 'ACCOUNT_NUMBER_GENERATION_FAILED',
                message: 'Unable to generate a unique internal account number. Please retry the request.'
            };
        }

        return {
            statusCode: 409,
            errorCode: 'DUPLICATE_ACCOUNT_COMBINATION',
            message: 'The debit account number and IFSC code are already registered.'
        };
    }

    // Common account-type uniqueness check.
    if (
        customerAccountTypeExists(
            database,
            customerId,
            accountIFSCCode,
            accountType
        )
    ) {
        return {
            statusCode: 409,
            errorCode: 'ACCOUNT_TYPE_ALREADY_EXISTS',
            message: 'The customer already has an account of this type for the supplied IFSC code.'
        };
    }

    // Update context only after successful validation.
    if (isInternalAccount) {
        account.debitAccountNo = resolvedDebitAccountNo;
        account.ifscCode = accountIFSCCode;
    }

    return null;
}