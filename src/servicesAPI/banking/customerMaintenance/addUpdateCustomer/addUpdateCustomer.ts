
import { basicAuthHelper } from '../../../../Authorization/BasicAuthorization/basicAuthHelper';
import type { ServiceContext } from '../../../../context/requestContext';
import type { ServiceResponse } from '../../../../serviceManagement/serviceResponse';
import { addUpdateCustomerClientDefinition } from './addUpdateCustomerClientDefinition';
import { addUpdateCustomerTechnicalValidator } from './addUpdateCustomerTechnicalValidator';
import { addUpdateCustomerFunctionalValidator } from './addUpdateCustomerFunctionalValidator';
import type { DatabaseSync } from 'node:sqlite';
import { createCustomer, fetchCustomer, updateCustomer } from '../../../../DataAccessLayer/customerMaintenance/customerDAL';


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

    try {
        if (action === 'CREATE') {
            const createAccount = account!;

            createCustomer(database, {
                customerId,
                customer: {
                    customerFirstName: customerFirstName as string,
                    customerLastName: customerLastName as string,
                    customerMobileNo: customerMobileNo as string,
                    customerPAN,
                    customerGender: customerGender ?? null
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
