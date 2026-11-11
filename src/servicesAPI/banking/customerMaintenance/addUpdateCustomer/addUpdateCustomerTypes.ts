import type { ServiceContext } from '../../../../context/requestContext';

export type AddUpdateCustomerAction =
    | 'CREATE'
    | 'UPDATE';

export type OpenOrLinkAccount =
    | 'YES'
    | 'NO';

export type AccountType =
    | 'SAVINGS'
    | 'CURRENT';

export type AddUpdateCustomerAccount = {
    debitAccountNo?: string | null;
    ifscCode?: string | null;
    accountType: AccountType;
    openOrLinkAccount: OpenOrLinkAccount;
};

export type AddUpdateCustomerRequest = {
    customerId?: string | null;
    customerName?: string | null;
    customerMobileNo?: string | null;
    customerPAN?: string | null;
    customerGender?: string | null;
    account?: AddUpdateCustomerAccount | null;
    action: AddUpdateCustomerAction;
};

export type AddUpdateCustomerServiceError = {
    statusCode: number;
    errorCode: string;
    message: string;
};

export type AddUpdateCustomerAccountPayload = {
    debitAccountNo?: string | null;
    ifscCode?: string | null;
    accountType?: 1 | 2 | null;
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
    | {
        valid: true;
        context: AddUpdateCustomerContext;
    }
    | {
        valid: false;
        error: AddUpdateCustomerServiceError;
    };

export type AddUpdateCustomerFunctionalValidationResult =
    | { valid: true; context: AddUpdateCustomerContext }
    | { valid: false; error: AddUpdateCustomerServiceError };