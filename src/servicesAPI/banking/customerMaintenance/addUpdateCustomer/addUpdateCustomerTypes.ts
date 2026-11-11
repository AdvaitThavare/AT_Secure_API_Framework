import type { ServiceContext } from '../../../../context/requestContext';

export type AddUpdateCustomerAction = 'CREATE' | 'UPDATE';

export type OpenOrLinkAccount = 'YES' | 'NO';

export type AccountType = 1 | 2;

export type AddUpdateCustomerAccount = {
    debitAccountNo?: string | null;
    ifscCode?: string | null;
    accountType?: AccountType | null;
    openOrLinkAccount?: OpenOrLinkAccount | null;
};

export type AddUpdateCustomerRequest = {
    customerId?: string | null;
    customerFirstName?: string | null;
    customerLastName?: string | null;
    customerMobileNo?: string | null;
    customerPAN?: string | null;
    customerGender?: string | null;
    account?: AddUpdateCustomerAccount | null;
    action?: AddUpdateCustomerAction | null;
};

export type AddUpdateCustomerServiceError = {
    statusCode: number;
    errorCode: string;
    message: string;
};

export type AddUpdateCustomerAccountPayload = {
    debitAccountNo?: string | null;
    ifscCode?: string | null;
    accountType?: AccountType | null;
    openOrLinkAccount?: 'YES' | 'NO' | null;
};

export type AddUpdateCustomerPayload = {
    action: 'CREATE' | 'UPDATE';
    customerId: string;
    customerPAN: string;
    customerFirstName?: string | null;
    customerLastName?: string | null;
    customerMobileNo?: string | null;
    customerGender?: string | null;
    account?: AddUpdateCustomerAccountPayload | null;
};

export type AddUpdateCustomerContext = Omit<ServiceContext, 'payload'> & {
    payload: AddUpdateCustomerPayload;
};

export type AddUpdateCustomerTechnicalValidationResult =
    | { valid: true; context: AddUpdateCustomerContext }
    | { valid: false; error: AddUpdateCustomerServiceError };

export type AddUpdateCustomerFunctionalValidationResult =
    | { valid: true; context: AddUpdateCustomerContext }
    | { valid: false; error: AddUpdateCustomerServiceError };