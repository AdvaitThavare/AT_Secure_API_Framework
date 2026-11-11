import type { AddUpdateCustomerContext, AddUpdateCustomerServiceError, AddUpdateCustomerTechnicalValidationResult } from './addUpdateCustomerTypes';
import type { ServiceContext } from '../../../../context/requestContext';

type StringFormat =
    | 'personName'
    | 'indianMobileNo'
    | 'indianPAN'
    | 'numericAccountNumber'
    | 'indianIFSC';

type StringFieldSchema = {
    type: 'string';
    format?: StringFormat;
    minLength?: number;
    maxLength?: number;
    allowedValues?: readonly string[];
};

type ObjectFieldSchema = {
    type: 'object';
    fields: Record<string, FieldSchema>;
};

type NumberFieldSchema = {
    type: 'number';
    allowedValues?: readonly number[];
};

type FieldSchema = StringFieldSchema | NumberFieldSchema | ObjectFieldSchema;

type RequestSchema = ObjectFieldSchema;

const addUpdateCustomerSchema = {
    type: 'object',
    fields: {
        customerId: {
            type: 'string'
        },
        customerFirstName: {
            type: 'string',
            format: 'personName',
            minLength: 3,
            maxLength: 25
        },
        customerLastName: {
            type: 'string',
            format: 'personName',
            minLength: 3,
            maxLength: 25
        },
        customerMobileNo: {
            type: 'string',
            format: 'indianMobileNo',
            minLength: 10,
            maxLength: 10
        },
        customerPAN: {
            type: 'string',
            format: 'indianPAN',
            minLength: 10,
            maxLength: 10
        },
        customerGender: {
            type: 'string'
        },
        account: {
            type: 'object',
            fields: {
                debitAccountNo: {
                    type: 'string',
                    format: 'numericAccountNumber',
                    minLength: 9,
                    maxLength: 18
                },
                ifscCode: {
                    type: 'string',
                    format: 'indianIFSC',
                    minLength: 11,
                    maxLength: 11
                },
                accountType: {
                    type: 'number',
                    allowedValues: [1, 2]
                },
                openOrLinkAccount: {
                    type: 'string',
                    allowedValues: ['YES', 'NO']
                }
            }
        },
        action: {
            type: 'string',
            allowedValues: ['CREATE', 'UPDATE']
        }
    }
} satisfies RequestSchema;

function unknownFieldCheck(
    payload: Record<string, unknown>,
    schema: ObjectFieldSchema,
    parentPath = ''
): AddUpdateCustomerServiceError | null {

    // Check the fields at the current object level first.
    for (const fieldName of Object.keys(payload)) {
        if (!Object.prototype.hasOwnProperty.call(schema.fields, fieldName)) {
            const fieldPath = parentPath
                ? `${parentPath}.${fieldName}`
                : fieldName;

            return {
                statusCode: 400,
                errorCode: 'BAD_REQUEST',
                message: `Unknown field '${fieldPath}'.`
            };
        }
    }

    // Recursively check nested objects defined in the schema.
    for (const [fieldName, fieldSchema] of Object.entries(schema.fields)) {
        if (fieldSchema.type !== 'object') {
            continue;
        }

        const fieldValue = payload[fieldName];

        // Leave null and non-object values for dataTypeCheck.
        if (
            fieldValue === null ||
            typeof fieldValue !== 'object' ||
            Array.isArray(fieldValue)
        ) {
            continue;
        }

        const fieldPath = parentPath
            ? `${parentPath}.${fieldName}`
            : fieldName;

        const unknownFieldError = unknownFieldCheck(
            fieldValue as Record<string, unknown>,
            fieldSchema,
            fieldPath
        );

        if (unknownFieldError !== null) {
            return unknownFieldError;
        }
    }

    return null;
}


function dataTypeCheck(
    payload: Record<string, unknown>,
    schema: ObjectFieldSchema,
    parentPath = ''
): AddUpdateCustomerServiceError | null {
    for (const [fieldName, fieldSchema] of Object.entries(schema.fields)) {
        if (!Object.prototype.hasOwnProperty.call(payload, fieldName)) {
            continue;
        }

        const fieldValue = payload[fieldName];

        // Null values are handled by subsequent validation phases.
        if (fieldValue === null) {
            continue;
        }

        const fieldPath = parentPath
            ? `${parentPath}.${fieldName}`
            : fieldName;

        if (fieldSchema.type === 'string') {
            if (typeof fieldValue !== 'string') {
                return {
                    statusCode: 400,
                    errorCode: 'BAD_REQUEST',
                    message: `${fieldPath} must be a string.`
                };
            }

            continue;
        }

        if (fieldSchema.type === 'number') {
            if (typeof fieldValue !== 'number' || !Number.isInteger(fieldValue)) {
                return {
                    statusCode: 400,
                    errorCode: 'BAD_REQUEST',
                    message: `${fieldPath} must be an integer.`
                };
            }

            continue;
        }

        if (
            typeof fieldValue !== 'object' ||
            Array.isArray(fieldValue)
        ) {
            return {
                statusCode: 400,
                errorCode: 'BAD_REQUEST',
                message: `${fieldPath} must be an object.`
            };
        }

        const dataTypeError = dataTypeCheck(
            fieldValue as Record<string, unknown>,
            fieldSchema,
            fieldPath
        );

        if (dataTypeError !== null) {
            return dataTypeError;
        }
    }

    return null;
}

function isEmptyValue(value: unknown): boolean {
    return (
        value === undefined ||
        value === null ||
        (typeof value === 'string' && value.trim() === '')
    );
}

function customerIdentityCheck(
    payload: Record<string, unknown>,
    basicAuthUsername: string
): AddUpdateCustomerServiceError | null {
    const customerId = payload.customerId;

    // Compare only a non-empty string; other cases are handled by later checks.
    if (
        typeof customerId === 'string' &&
        !isEmptyValue(customerId) &&
        customerId !== basicAuthUsername
    ) {
        return {
            statusCode: 403,
            errorCode: 'CUSTOMER_ID_MISMATCH',
            message: 'customerId must match the Basic Auth username.'
        };
    }

    return null;
}

function dataFormatCheck(
    payload: Record<string, unknown>,
    schema: ObjectFieldSchema,
    parentPath = ''
): AddUpdateCustomerServiceError | null {
    for (const [fieldName, fieldSchema] of Object.entries(schema.fields)) {
        if (!Object.prototype.hasOwnProperty.call(payload, fieldName)) {
            continue;
        }

        const fieldValue = payload[fieldName];

        // Empty values are handled by conditionalDataCheck.
        if (isEmptyValue(fieldValue)) {
            continue;
        }

        const fieldPath = parentPath
            ? `${parentPath}.${fieldName}`
            : fieldName;

        // Validate nested objects using the same schema-driven function.
        if (fieldSchema.type === 'object') {
            const formatError = dataFormatCheck(
                fieldValue as Record<string, unknown>,
                fieldSchema,
                fieldPath
            );

            if (formatError !== null) {
                return formatError;
            }

            continue;
        }

        if (fieldSchema.type === 'number') {
            if (
                fieldSchema.allowedValues !== undefined &&
                !fieldSchema.allowedValues.includes(fieldValue as number)
            ) {
                return {
                    statusCode: 400,
                    errorCode: 'BAD_REQUEST',
                    message: `${fieldPath} must be ${fieldSchema.allowedValues.join(' or ')}.`
                };
            }

            continue;
        }

        if (fieldSchema.type === 'string') {
            // dataTypeCheck has already verified that this is a string.
            if (typeof fieldValue !== 'string') {
                return {
                    statusCode: 400,
                    errorCode: 'BAD_REQUEST',
                    message: `${fieldPath} must be a string.`
                };
            }

            // Generic minimum-length check.
            if (
                fieldSchema.minLength !== undefined &&
                fieldValue.length < fieldSchema.minLength
            ) {
                return {
                    statusCode: 400,
                    errorCode: 'BAD_REQUEST',
                    message: `${fieldPath} must be at least ${fieldSchema.minLength} characters long.`
                };
            }

            // Generic maximum-length check.
            if (
                fieldSchema.maxLength !== undefined &&
                fieldValue.length > fieldSchema.maxLength
            ) {
                return {
                    statusCode: 400,
                    errorCode: 'BAD_REQUEST',
                    message: `${fieldPath} must not exceed ${fieldSchema.maxLength} characters.`
                };
            }

            // Generic allowed-value check.
            if (
                fieldSchema.allowedValues !== undefined &&
                !fieldSchema.allowedValues.includes(fieldValue)
            ) {
                return {
                    statusCode: 400,
                    errorCode: 'BAD_REQUEST',
                    message: `${fieldPath} must be ${fieldSchema.allowedValues.join(' or ')}.`
                };
            }

            // Specialized field-format checks will be dispatched here.
            if (fieldSchema.format !== undefined) {
                const formatError = specializedFormatCheck(
                    fieldSchema.format,
                    fieldValue,
                    fieldPath
                );

                if (formatError !== null) {
                    return formatError;
                }
            }
        }
        continue;
    }
    return null;
}

function specializedFormatCheck(
    format: StringFormat,
    value: string,
    fieldPath: string
): AddUpdateCustomerServiceError | null {
    switch (format) {
        case 'personName':
            return validatePersonName(value, fieldPath);

        case 'indianMobileNo':
            return validateIndianMobileNo(value, fieldPath);

        case 'indianPAN':
            return validateIndianPAN(value, fieldPath);

        case 'numericAccountNumber':
            return validateNumericAccountNumber(value, fieldPath);

        case 'indianIFSC':
            return validateIndianIFSC(value, fieldPath);
    }
}

function validatePersonName(
    value: string,
    fieldPath: string
): AddUpdateCustomerServiceError | null {
    if (!/^[A-Za-z]+(?:[-'][A-Za-z]+)*$/.test(value)) {
        return {
            statusCode: 400,
            errorCode: 'BAD_REQUEST',
            message: `${fieldPath} must contain only alphabets, hyphens, or apostrophes, with no separators at the beginning or end.`
        };
    }

    return null;
}

function validateIndianMobileNo(
    value: string,
    fieldPath: string
): AddUpdateCustomerServiceError | null {
    if (!/^[6-9][0-9]{9}$/.test(value)) {
        return {
            statusCode: 400,
            errorCode: 'BAD_REQUEST',
            message: `${fieldPath} must be a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.`
        };
    }

    return null;
}

function validateIndianPAN(
    value: string,
    fieldPath: string
): AddUpdateCustomerServiceError | null {
    if (!/^[A-Z]{3}P[A-Z][0-9]{4}[A-Z]$/.test(value)) {
        return {
            statusCode: 400,
            errorCode: 'BAD_REQUEST',
            message: `${fieldPath} must follow the Indian PAN format: 5 alphabets, 4 digits, and 1 alphabet, with P as the fourth character.`
        };
    }

    return null;
}

function validateNumericAccountNumber(
    value: string,
    fieldPath: string
): AddUpdateCustomerServiceError | null {
    if (!/^[0-9]+$/.test(value)) {
        return {
            statusCode: 400,
            errorCode: 'BAD_REQUEST',
            message: `${fieldPath} must contain digits only.`
        };
    }

    return null;
}

function validateIndianIFSC(
    value: string,
    fieldPath: string
): AddUpdateCustomerServiceError | null {
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(value)) {
        return {
            statusCode: 400,
            errorCode: 'BAD_REQUEST',
            message: `${fieldPath} must follow the Indian IFSC format: 4 uppercase alphabets, 0 as the fifth character, and 6 uppercase alphanumeric characters.`
        };
    }

    return null;
}

function conditionalDataCheck(
    payload: Record<string, unknown>
): AddUpdateCustomerServiceError | null {
    const customerDataError = customerDataCheck(payload);

    if (customerDataError !== null) {
        return customerDataError;
    }

    return accountDataCheck(payload);
}

function customerDataCheck(
    payload: Record<string, unknown>
): AddUpdateCustomerServiceError | null {
    // Action is mandatory for both CREATE and UPDATE.
    if (isEmptyValue(payload.action)) {
        return {
            statusCode: 400,
            errorCode: 'BAD_REQUEST',
            message: 'action is required.'
        };
    }

    const action = payload.action as 'CREATE' | 'UPDATE';

    // Customer ID is mandatory for both actions.
    if (isEmptyValue(payload.customerId)) {
        return {
            statusCode: 400,
            errorCode: 'BAD_REQUEST',
            message: 'customerId is required.'
        };
    }

    // PAN is mandatory for both actions.
    if (isEmptyValue(payload.customerPAN)) {
        return {
            statusCode: 400,
            errorCode: 'BAD_REQUEST',
            message: 'customerPAN is required.'
        };
    }

    // CREATE requires the core customer details.
    if (action === 'CREATE') {
        const requiredFields = [
            'customerFirstName',
            'customerLastName',
            'customerMobileNo'
        ] as const;

        for (const fieldName of requiredFields) {
            if (isEmptyValue(payload[fieldName])) {
                return {
                    statusCode: 400,
                    errorCode: 'BAD_REQUEST',
                    message: `${fieldName} is required for CREATE.`
                };
            }
        }
    }

    return null;
}

function accountDataCheck(
    payload: Record<string, unknown>
): AddUpdateCustomerServiceError | null {
    const account = payload.account;
    const action = payload.action as 'CREATE' | 'UPDATE';

    // Account details are mandatory for CREATE.
    if (action === 'CREATE') {
        if (isEmptyValue(account)) {
            return {
                statusCode: 400,
                errorCode: 'BAD_REQUEST',
                message: 'account is required for CREATE.'
            };
        }

        const accountDetails = account as Record<string, unknown>;
        const debitAccountNo = accountDetails.debitAccountNo;
        const ifscCode = accountDetails.ifscCode;

        // Debit account number and IFSC must be provided together.
        if (
            isEmptyValue(debitAccountNo) !==
            isEmptyValue(ifscCode)
        ) {
            return {
                statusCode: 400,
                errorCode: 'BAD_REQUEST',
                message: 'Account Details missing.'
            };
        }

        if (isEmptyValue(accountDetails.accountType)) {
            return {
                statusCode: 400,
                errorCode: 'BAD_REQUEST',
                message: 'account.accountType is required for CREATE.'
            };
        }

        if (accountDetails.openOrLinkAccount !== 'YES') {
            return {
                statusCode: 400,
                errorCode: 'BAD_REQUEST',
                message: 'account.openOrLinkAccount must be YES for CREATE.'
            };
        }
    }

    // UPDATE can omit account details.
    if (action === 'UPDATE') {
        if (isEmptyValue(account)) {
            return null;
        }

        const accountDetails = account as Record<string, unknown>;

        if (isEmptyValue(accountDetails.openOrLinkAccount)) {
            return {
                statusCode: 400,
                errorCode: 'BAD_REQUEST',
                message: 'account.openOrLinkAccount is required when account details are provided.'
            };
        }

        // No account operation is required.
        if (accountDetails.openOrLinkAccount === 'NO') {
            return null;
        }

        if (accountDetails.openOrLinkAccount === 'YES') {
            if (isEmptyValue(accountDetails.accountType)) {
                return {
                    statusCode: 400,
                    errorCode: 'BAD_REQUEST',
                    message: 'account.accountType is required when openOrLinkAccount is YES.'
                };
            }

            const hasDebitAccountNo = !isEmptyValue(accountDetails.debitAccountNo);
            const hasIFSCCode = !isEmptyValue(accountDetails.ifscCode);

            // Both external account details must be provided together.
            if (hasDebitAccountNo !== hasIFSCCode) {
                return {
                    statusCode: 400,
                    errorCode: 'BAD_REQUEST',
                    message: 'Debit account number and IFSC code must be provided together.'
                };
            }
        }
    }

    return null;
}

export function addUpdateCustomerTechnicalValidator(
    context: ServiceContext,
    basicAuthUsername: string
): AddUpdateCustomerTechnicalValidationResult {
    // This API accepts JSON requests only.
    if (context.requestMediaType !== 'application/json') {
        return {
            valid: false,
            error: {
                statusCode: 415,
                errorCode: 'UNSUPPORTED_CONTENT_TYPE',
                message: 'Unsupported Content-Type. Expected application/json.'
            }
        };
    }

    // The framework's JSON parser guarantees an object payload on success.
    const payload = context.payload as Record<string, unknown>;

    // 1. Customer identity check.
    const identityError = customerIdentityCheck(
        payload,
        basicAuthUsername
    );

    if (identityError !== null) {
        return {
            valid: false,
            error: identityError
        };
    }

    // 2. Unknown-field check.
    const unknownFieldError = unknownFieldCheck(
        payload,
        addUpdateCustomerSchema
    );

    if (unknownFieldError !== null) {
        return {
            valid: false,
            error: unknownFieldError
        };
    }

    // 3. Data-type check.
    const dataTypeError = dataTypeCheck(
        payload,
        addUpdateCustomerSchema
    );

    if (dataTypeError !== null) {
        return {
            valid: false,
            error: dataTypeError
        };
    }

    // 4. Data-format check.
    const dataFormatError = dataFormatCheck(
        payload,
        addUpdateCustomerSchema
    );

    if (dataFormatError !== null) {
        return {
            valid: false,
            error: dataFormatError
        };
    }

    // 5. Conditional data check.
    const conditionalError = conditionalDataCheck(payload);

    if (conditionalError !== null) {
        return {
            valid: false,
            error: conditionalError
        };
    }

    return {
        valid: true,
        context: context as AddUpdateCustomerContext
    };
}