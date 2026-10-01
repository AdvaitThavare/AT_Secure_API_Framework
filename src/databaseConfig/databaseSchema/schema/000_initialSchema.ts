import type { DatabaseSync } from 'node:sqlite';

export const initialSchema = {
    name: '000_initialSchema',

    execute(database: DatabaseSync): void {
        database.exec(`
            CREATE TABLE IF NOT EXISTS customer_Credentials (
                LDAP_username TEXT PRIMARY KEY,
                LDAP_password TEXT NOT NULL
            ) STRICT;

            CREATE TABLE IF NOT EXISTS customer_Status (
                statusCode INTEGER PRIMARY KEY,
                statusDescription TEXT NOT NULL UNIQUE
            ) STRICT;

            CREATE TABLE IF NOT EXISTS account_Status (
                statusCode INTEGER PRIMARY KEY,
                statusDescription TEXT NOT NULL UNIQUE
            ) STRICT;

            CREATE TABLE IF NOT EXISTS customer_Details (
                customerId TEXT PRIMARY KEY,
                customerName TEXT NOT NULL,
                customerMobileNo TEXT NOT NULL UNIQUE,
                customerPAN TEXT NOT NULL UNIQUE,
                customerGender TEXT NOT NULL,
                customerStatus INTEGER NOT NULL,
                FOREIGN KEY (customerId)
                    REFERENCES customer_Credentials(LDAP_username),
                FOREIGN KEY (customerStatus)
                    REFERENCES customer_Status(statusCode)
            ) STRICT;

            CREATE TABLE IF NOT EXISTS customer_Account_Details (
                serialNo INTEGER PRIMARY KEY,
                customerId TEXT NOT NULL,
                debitAccountNo TEXT NOT NULL,
                ifscCode TEXT NOT NULL,
                accountBalance INTEGER NOT NULL,
                accountStatus INTEGER NOT NULL,
                UNIQUE (debitAccountNo, ifscCode),
                FOREIGN KEY (customerId)
                    REFERENCES customer_Details(customerId),
                FOREIGN KEY (accountStatus)
                    REFERENCES account_Status(statusCode)
            ) STRICT;

            CREATE TABLE IF NOT EXISTS framework_Request_Reference (
                requestContextId TEXT PRIMARY KEY,
                externalReferenceNo TEXT NOT NULL UNIQUE
            ) STRICT;
        `);
    }
};