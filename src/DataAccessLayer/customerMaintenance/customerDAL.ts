import type { DatabaseSync } from 'node:sqlite';

export type CustomerDALErrorCode =
    | 'CUSTOMER_ALREADY_EXISTS'
    | 'CUSTOMER_NOT_FOUND'
    | 'DUPLICATE_ACCOUNT_COMBINATION'
    | 'ACCOUNT_TYPE_ALREADY_EXISTS';

export class CustomerDALError extends Error {
    constructor(
        public readonly errorCode: CustomerDALErrorCode
    ) {
        super(errorCode);
        this.name = 'CustomerDALError';
    }
}

const SQLITE_CONSTRAINT_PRIMARYKEY = 1555;
const SQLITE_CONSTRAINT_UNIQUE = 2067;

function mapCustomerDatabaseError(error: unknown): unknown {
    if (error instanceof CustomerDALError) {
        return error;
    }

    if (!(error instanceof Error)) {
        return error;
    }

    const sqliteErrorCode = (
        error as Error & { errcode?: number }
    ).errcode;

    if (
        sqliteErrorCode !== SQLITE_CONSTRAINT_PRIMARYKEY &&
        sqliteErrorCode !== SQLITE_CONSTRAINT_UNIQUE
    ) {
        return error;
    }

    const errorMessage = error.message;

    // Customer ID uniqueness.
    if (errorMessage.includes('customer_Details.customerId')) {
        return new CustomerDALError('CUSTOMER_ALREADY_EXISTS');
    }

    // Customer + IFSC + account type uniqueness.
    if (
        errorMessage.includes('customer_Account_Details.customerId') &&
        errorMessage.includes('customer_Account_Details.ifscCode') &&
        errorMessage.includes('customer_Account_Details.accountType')
    ) {
        return new CustomerDALError('ACCOUNT_TYPE_ALREADY_EXISTS');
    }

    // Debit account number + IFSC uniqueness.
    if (
        errorMessage.includes('customer_Account_Details.debitAccountNo') &&
        errorMessage.includes('customer_Account_Details.ifscCode')
    ) {
        return new CustomerDALError('DUPLICATE_ACCOUNT_COMBINATION');
    }

    return error;
}

// ***********CreateCustomer***********//

const INITIAL_ACCOUNT_BALANCE = 10000;

interface NewCustomerDetails {
    customerFirstName: string;
    customerLastName: string;
    customerMobileNo: string;
    customerPAN: string;
    customerGender: string | null;
}

interface NewCustomerAccount {
    debitAccountNo: string;
    ifscCode: string;
    accountType: number;
}

interface CreateCustomerInput {
    customerId: string;
    customer: NewCustomerDetails;
    account: NewCustomerAccount;
}

type UpdateCustomerDetails = Partial<Pick<
    NewCustomerDetails,
    | 'customerFirstName'
    | 'customerLastName'
    | 'customerMobileNo'
    | 'customerGender'
>>;

interface UpdateCustomerInput {
    customerId: string;
    customer: UpdateCustomerDetails;
    account?: NewCustomerAccount;
}

type CustomerUpdateColumn =
    | 'customerFirstName'
    | 'customerLastName'
    | 'customerMobileNo'
    | 'customerGender';

interface CustomerUpdate {
    column: CustomerUpdateColumn;
    value: string;
}

function customerIdCheck(
    database: DatabaseSync,
    customerId: string
): boolean {
    const customerIdQuery = database.prepare(`
        SELECT 1
        FROM customer_Details
        WHERE customerId = ?
        LIMIT 1;
    `);

    return customerIdQuery.get(customerId) !== undefined;
}

export function accountCombinationExists(
    database: DatabaseSync,
    debitAccountNo: string,
    ifscCode: string
): boolean {
    const accountCombinationQuery = database.prepare(`
        SELECT 1
        FROM customer_Account_Details
        WHERE debitAccountNo = ?
            AND ifscCode = ?
        LIMIT 1;
    `);

    return accountCombinationQuery.get(
        debitAccountNo,
        ifscCode
    ) !== undefined;
}

export function customerAccountTypeExists(
    database: DatabaseSync,
    customerId: string,
    ifscCode: string,
    accountType: number
): boolean {
    const customerAccountTypeQuery = database.prepare(`
        SELECT 1
        FROM customer_Account_Details
        INNER JOIN account_Type
            ON customer_Account_Details.accountType = account_Type.accountTypeDescription
        WHERE customer_Account_Details.customerId = ?
            AND customer_Account_Details.ifscCode = ?
            AND account_Type.accountType = ?
        LIMIT 1;
    `);

    return customerAccountTypeQuery.get(customerId, ifscCode, accountType) !== undefined;
}

function getAccountTypeDescription(
    database: DatabaseSync,
    accountType: number
): string {
    const accountTypeQuery = database.prepare(`
        SELECT accountTypeDescription
        FROM account_Type
        WHERE accountType = ?;
    `);

    const result = accountTypeQuery.get(accountType);

    if (result === undefined) {
        throw new Error(`Invalid account type: ${accountType}`);
    }

    return result.accountTypeDescription as string;
}

// ***********CreateCustomer***********//

export function createCustomer(
    database: DatabaseSync,
    input: CreateCustomerInput
): void {
    database.exec('BEGIN');

    try {
        if (customerIdCheck(database, input.customerId)) {
            throw new CustomerDALError('CUSTOMER_ALREADY_EXISTS');
        }

        createCustomerDetails(
            database,
            input.customerId,
            input.customer
        );

        createAccountDetails(
            database,
            input.customerId,
            input.account
        );

        database.exec('COMMIT');
    } catch (error) {
        database.exec('ROLLBACK');
        throw mapCustomerDatabaseError(error);
    }
}

function createCustomerDetails(
    database: DatabaseSync,
    customerId: string,
    customer: NewCustomerDetails
): void {
    const customerDetailsInsert = database.prepare(`
        INSERT INTO customer_Details (
            customerId,
            customerFirstName,
            customerLastName,
            customerMobileNo,
            customerPAN,
            customerGender,
            customerStatus
        )
        VALUES (?, ?, ?, ?, ?, ?, ?);
    `);

    customerDetailsInsert.run(
        customerId,
        customer.customerFirstName,
        customer.customerLastName,
        customer.customerMobileNo,
        customer.customerPAN,
        customer.customerGender,
        'ACTIVE'
    );
}

function createAccountDetails(
    database: DatabaseSync,
    customerId: string,
    account: NewCustomerAccount
): void {
    insertCustomerAccount(database, customerId, account);
}


// ***********UpdateCustomer***********//

export function updateCustomer(
    database: DatabaseSync,
    input: UpdateCustomerInput
): void {
    database.exec('BEGIN');

    try {
        if (!customerIdCheck(database, input.customerId)) {
            throw new CustomerDALError('CUSTOMER_NOT_FOUND');
        }

        updateCustomerDetails(
            database,
            input.customerId,
            input.customer
        );

        if (input.account !== undefined) {
            updateAccountDetails(
                database,
                input.customerId,
                input.account
            );
        }

        database.exec('COMMIT');
    } catch (error) {
        database.exec('ROLLBACK');
        throw mapCustomerDatabaseError(error);
    }
}

function updateCustomerDetails(
    database: DatabaseSync,
    customerId: string,
    customer: UpdateCustomerDetails
): void {
    const customerUpdates: CustomerUpdate[] = [];

    const {
        customerFirstName,
        customerLastName,
        customerMobileNo,
        customerGender
    } = customer;

    if (
        customerFirstName !== undefined &&
        customerFirstName.trim() !== ''
    ) {
        customerUpdates.push({
            column: 'customerFirstName',
            value: customerFirstName
        });
    }

    if (
        customerLastName !== undefined &&
        customerLastName.trim() !== ''
    ) {
        customerUpdates.push({
            column: 'customerLastName',
            value: customerLastName
        });
    }

    if (
        customerMobileNo !== undefined &&
        customerMobileNo.trim() !== ''
    ) {
        customerUpdates.push({
            column: 'customerMobileNo',
            value: customerMobileNo
        });
    }

    if (
        customerGender !== undefined &&
        customerGender !== null &&
        customerGender.trim() !== ''
    ) {
        customerUpdates.push({
            column: 'customerGender',
            value: customerGender
        });
    }

    if (customerUpdates.length === 0) {
        return;
    }

    const updateFields = customerUpdates
        .map(({ column }) => `${column} = ?`)
        .join(', ');

    const customerDetailsUpdate = database.prepare(`
        UPDATE customer_Details
        SET ${updateFields}
        WHERE customerId = ?;
    `);

    customerDetailsUpdate.run(
        ...customerUpdates.map(({ value }) => value),
        customerId
    );
}

function updateAccountDetails(
    database: DatabaseSync,
    customerId: string,
    account: NewCustomerAccount
): void {
    insertCustomerAccount(database, customerId, account);
}

// ***********SharedAccountPersistence***********//

function insertCustomerAccount(
    database: DatabaseSync,
    customerId: string,
    account: NewCustomerAccount
): void {
    const accountTypeDescription = getAccountTypeDescription(
        database,
        account.accountType
    );
    const customerAccountInsert = database.prepare(`
        INSERT INTO customer_Account_Details (
            customerId,
            debitAccountNo,
            ifscCode,
            accountType,
            accountBalance,
            accountStatus
        )
        VALUES (?, ?, ?, ?, ?, ?);
    `);

    customerAccountInsert.run(
        customerId,
        account.debitAccountNo,
        account.ifscCode,
        accountTypeDescription,
        INITIAL_ACCOUNT_BALANCE,
        'ACTIVE'
    );
}

// ***********FetchCustomer***********//

interface CustomerDetailsRow {
    customerId: string;
    customerFirstName: string;
    customerLastName: string;
    customerMobileNo: string;
    customerPAN: string;
    customerGender: string | null;
    customerStatus: string;
}

interface CustomerAccount {
    debitAccountNo: string;
    ifscCode: string;
    accountType: string;
    accountStatus: string;
}

interface Customer {
    customerId: string;
    customerFirstName: string;
    customerLastName: string;
    customerMobileNo: string;
    customerPAN: string;
    customerGender: string | null;
    customerStatus: string;
    account: CustomerAccount[];
}

export function fetchCustomer(
    database: DatabaseSync,
    customerId: string
): Customer | undefined {
    const customerDetailsQuery = database.prepare(`
        SELECT
            customerId,
            customerFirstName,
            customerLastName,
            customerMobileNo,
            customerPAN,
            customerGender,
            customerStatus
        FROM customer_Details
        WHERE customerId = ?;
    `);

    const customerRow = customerDetailsQuery.get(customerId);

    if (customerRow === undefined) {
        return undefined;
    }

    const customerAccountsQuery = database.prepare(`
        SELECT
            debitAccountNo,
            ifscCode,
            accountType,
            accountStatus
        FROM customer_Account_Details
        WHERE customerId = ?
        ORDER BY serialNo;
    `);

    const accountRows = customerAccountsQuery.all(customerId);

    const account = accountRows.map((row) => ({
        debitAccountNo: row.debitAccountNo as string,
        ifscCode: row.ifscCode as string,
        accountType: row.accountType as string,
        accountStatus: row.accountStatus as string
    }));

    return {
        customerId: customerRow.customerId as string,
        customerFirstName: customerRow.customerFirstName as string,
        customerLastName: customerRow.customerLastName as string,
        customerMobileNo: customerRow.customerMobileNo as string,
        customerPAN: customerRow.customerPAN as string,
        customerGender: customerRow.customerGender as string | null,
        customerStatus: customerRow.customerStatus as string,
        account
    };
}