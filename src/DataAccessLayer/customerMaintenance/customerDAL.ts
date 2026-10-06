import type { DatabaseSync } from 'node:sqlite';


// ***********CreateCustomer***********//

const INITIAL_ACCOUNT_BALANCE = 10000;

interface NewCustomerDetails {
    customerName: string;
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

export function createCustomer(
    database: DatabaseSync,
    input: CreateCustomerInput
): void {
    if (customerIdCheck(database, input.customerId)) {
        throw new Error('Customer already exists. Only Update action is allowed');
    }

    database.exec('BEGIN');

    try {
        const customerDetailsInsert = database.prepare(`
            INSERT INTO customer_Details (
                customerId,
                customerName,
                customerMobileNo,
                customerPAN,
                customerGender,
                customerStatus
            )
            VALUES (?, ?, ?, ?, ?, ?);
`);

        customerDetailsInsert.run(
            input.customerId,
            input.customer.customerName,
            input.customer.customerMobileNo,
            input.customer.customerPAN,
            input.customer.customerGender,
            1
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
            input.customerId,
            input.account.debitAccountNo,
            input.account.ifscCode,
            input.account.accountType,
            INITIAL_ACCOUNT_BALANCE,
            1
        );
        database.exec('COMMIT');
    } catch (error) {
        database.exec('ROLLBACK');
        throw error;
    }
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


// ***********FetchCustomer***********//

interface CustomerDetailsRow {
    customerId: string;
    customerName: string;
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
    customerName: string;
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
            cd.customerId,
            cd.customerName,
            cd.customerMobileNo,
            cd.customerPAN,
            cd.customerGender,
            cs.statusDescription AS customerStatus
        FROM customer_Details cd
        INNER JOIN customer_Status cs
            ON cd.customerStatus = cs.statusCode
        WHERE cd.customerId = ?;
    `);

    const customerRow = customerDetailsQuery.get(customerId);

    if (customerRow === undefined) {
        return undefined;
    }

    const customerDetails: CustomerDetailsRow = {
        customerId: customerRow.customerId as string,
        customerName: customerRow.customerName as string,
        customerMobileNo: customerRow.customerMobileNo as string,
        customerPAN: customerRow.customerPAN as string,
        customerGender: customerRow.customerGender as string | null,
        customerStatus: customerRow.customerStatus as string
    };

    const customerAccountsQuery = database.prepare(`
        SELECT
            cad.debitAccountNo,
            cad.ifscCode,
            at.accountTypeDescription AS accountType,
            ast.statusDescription AS accountStatus
        FROM customer_Account_Details cad
        INNER JOIN account_Type at
            ON cad.accountType = at.accountType
        INNER JOIN account_Status ast
            ON cad.accountStatus = ast.statusCode
        WHERE cad.customerId = ?
        ORDER BY cad.serialNo;
    `);

    const accountRows = customerAccountsQuery.all(customerId);

    const account = accountRows.map((row) => ({
        debitAccountNo: row.debitAccountNo as string,
        ifscCode: row.ifscCode as string,
        accountType: row.accountType as string,
        accountStatus: row.accountStatus as string
    }));
    return {
        ...customerDetails,
        account
    };
}