
import { basicAuthHelper } from '../../../../Authorization/BasicAuthorization/basicAuthHelper';
import type { ServiceContext } from '../../../../context/requestContext';
import type { ServiceResponse } from '../../../../serviceManagement/serviceResponse';
import { addUpdateCustomerClientDefinition } from './addUpdateCustomerClientDefinition';
import { addUpdateCustomerTechnicalValidator } from './addUpdateCustomerTechnicalValidator';
import { addUpdateCustomerFunctionalValidator } from './addUpdateCustomerFunctionalValidator';
import type { DatabaseSync } from 'node:sqlite';
import { CustomerDALError, createCustomer, fetchCustomer, updateCustomer } from '../../../../DataAccessLayer/customerMaintenance/customerDAL';


function validateCustomerCredentials(
    username: string,
    password: string
): ServiceResponse | null {
    if (
        username !== addUpdateCustomerClientDefinition.username ||
        password !== addUpdateCustomerClientDefinition.password
    ) {
        return {
            statusCode: 401,
            payload: {
                category: 'SERVER',
                statusCode: 401,
                errorCode: 'BASIC_AUTHORIZATION_FAILURE',
                message: 'Incorrect Username or Password'
            },
            payloadContentType: 'application/json',
            responseHeaders: {}
        };
    }

    return null;
}

const customerDALErrorResponses: Record<CustomerDALError['errorCode'], { statusCode: number; message: string }> = {
    CUSTOMER_ALREADY_EXISTS: {
        statusCode: 409,
        message: 'Customer already exists. Only Update action is allowed.'
    },
    CUSTOMER_MOBILE_ALREADY_EXISTS: {
        statusCode: 409,
        message: 'The mobile number is already registered to another customer.'
    },
    CUSTOMER_PAN_ALREADY_EXISTS: {
        statusCode: 409,
        message: 'The PAN is already registered to another customer.'
    },
    CUSTOMER_NOT_FOUND: {
        statusCode: 404,
        message: 'Customer does not exist. Only Create action is allowed.'
    },
    DUPLICATE_ACCOUNT_COMBINATION: {
        statusCode: 409,
        message: 'The debit account number and IFSC code are already registered.'
    },
    ACCOUNT_TYPE_ALREADY_EXISTS: {
        statusCode: 409,
        message: 'The customer already has an account of this type for the supplied IFSC code.'
    }
};

function customerDALErrorResponse(
    error: CustomerDALError
): ServiceResponse {
    const { statusCode, message } = customerDALErrorResponses[error.errorCode];

    return {
        statusCode,
        payload: {
            statusCode,
            errorCode: error.errorCode,
            message
        },
        payloadContentType: 'application/json',
        responseHeaders: {}
    };
}

export function addUpdateCustomer(
    context: ServiceContext,
    database: DatabaseSync
): ServiceResponse {
    const credentials = basicAuthHelper(context.requestHeaders);

    if ('errorCode' in credentials) {
        return {
            statusCode: credentials.statusCode,
            payload: credentials,
            payloadContentType: 'application/json',
            responseHeaders: {}
        };
    }

    const credentialValidationError = validateCustomerCredentials(
        credentials.username,
        credentials.password
    );

    if (credentialValidationError !== null) {
        return credentialValidationError;
    }

    const technicalValidationResult = addUpdateCustomerTechnicalValidator(
        context,
        credentials.username
    );

    if (!technicalValidationResult.valid) {
        const error = technicalValidationResult.error;

        return {
            statusCode: error.statusCode,
            payload: error,
            payloadContentType: 'application/json',
            responseHeaders: {}
        };
    }

    try {
        const functionalValidationResult = addUpdateCustomerFunctionalValidator(
            database,
            technicalValidationResult.context
        );

        if (!functionalValidationResult.valid) {
            const error = functionalValidationResult.error;

            return {
                statusCode: error.statusCode,
                payload: error,
                payloadContentType: 'application/json',
                responseHeaders: {}
            };
        }

        // Use the context returned by functional validation.
        // It may contain internally generated account details.
        const validatedPayload = functionalValidationResult.context.payload;

        const {
            action,
            customerId,
            customerFirstName,
            customerLastName,
            customerMobileNo,
            customerPAN,
            customerGender,
            account
        } = validatedPayload;

        if (action === 'UPDATE') {
            const hasCustomerDetailsUpdate = Boolean(
                customerFirstName?.trim() ||
                customerLastName?.trim() ||
                customerMobileNo?.trim() ||
                customerGender?.trim()
            );

            const hasAccountUpdate = account?.openOrLinkAccount === 'YES';

            if (!hasCustomerDetailsUpdate && !hasAccountUpdate) {
                return {
                    statusCode: 200,
                    payload: {
                        message: 'No new values provided; record remains unchanged.'
                    },
                    payloadContentType: 'application/json',
                    responseHeaders: {}
                };
            }
        }

        if (action === 'CREATE') {
            const createAccount = account!;

            createCustomer(database, {
                customerId,
                customer: {
                    customerFirstName: customerFirstName as string,
                    customerLastName: customerLastName as string,
                    customerMobileNo: customerMobileNo as string,
                    customerPAN,
                    customerGender: customerGender?.trim() ? customerGender : null
                },
                account: {
                    debitAccountNo: createAccount.debitAccountNo as string,
                    ifscCode: createAccount.ifscCode as string,
                    accountType: createAccount.accountType as number
                }
            });
        } else if (action === 'UPDATE') {
            updateCustomer(database, {
                customerId,
                customer: {
                    customerFirstName: customerFirstName ?? undefined,
                    customerLastName: customerLastName ?? undefined,
                    customerMobileNo: customerMobileNo ?? undefined,
                    customerGender: customerGender ?? undefined
                },
                ...(account?.openOrLinkAccount === 'YES'
                    ? {
                        account: {
                            debitAccountNo: account.debitAccountNo as string,
                            ifscCode: account.ifscCode as string,
                            accountType: account.accountType as number
                        }
                    }
                    : {})
            });
        }

        const customer = fetchCustomer(database, customerId);

        if (customer === undefined) {
            return {
                statusCode: 500,
                payload: {
                    statusCode: 500,
                    errorCode: 'CUSTOMER_FETCH_FAILED',
                    message: 'Customer operation completed, but customer details could not be retrieved.'
                },
                payloadContentType: 'application/json',
                responseHeaders: {}
            };
        }

        return {
            statusCode: action === 'CREATE' ? 201 : 200,
            payload: customer,
            payloadContentType: 'application/json',
            responseHeaders: {}
        };

    } catch (error) {
        if (error instanceof CustomerDALError) {
            return customerDALErrorResponse(error);
        }

        return {
            statusCode: 500,
            payload: {
                statusCode: 500,
                errorCode: 'CUSTOMER_MAINTENANCE_FAILED',
                message: 'Customer maintenance operation failed.'
            },
            payloadContentType: 'application/json',
            responseHeaders: {}
        };
    }
}
