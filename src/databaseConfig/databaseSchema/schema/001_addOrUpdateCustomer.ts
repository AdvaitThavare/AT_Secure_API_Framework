import type { DatabaseSync } from 'node:sqlite';

export const addOrUpdateCustomerSchema = {
    name: '001_addOrUpdateCustomer',

    execute(database: DatabaseSync): void {
        database.exec(`
            CREATE TABLE customer_Details_new (
                customerId TEXT PRIMARY KEY,
                customerName TEXT NOT NULL,
                customerMobileNo TEXT NOT NULL UNIQUE,
                customerPAN TEXT NOT NULL UNIQUE,
                customerGender TEXT,
                customerStatus INTEGER NOT NULL,
                FOREIGN KEY (customerId)
                    REFERENCES customer_Credentials(LDAP_username),
                FOREIGN KEY (customerStatus)
                    REFERENCES customer_Status(statusCode)
            ) STRICT;

            INSERT INTO customer_Details_new (
                customerId,
                customerName,
                customerMobileNo,
                customerPAN,
                customerGender,
                customerStatus
            )
            SELECT
                customerId,
                customerName,
                customerMobileNo,
                customerPAN,
                customerGender,
                customerStatus
            FROM customer_Details;

            DROP TABLE customer_Details;

            ALTER TABLE customer_Details_new
                RENAME TO customer_Details;

            CREATE TABLE account_Type (
                accountType INTEGER PRIMARY KEY,
                accountTypeDescription TEXT NOT NULL UNIQUE
            ) STRICT;

            CREATE TABLE customer_Account_Details_new (
                serialNo INTEGER PRIMARY KEY,
                customerId TEXT NOT NULL,
                debitAccountNo TEXT NOT NULL,
                ifscCode TEXT NOT NULL,
                accountType INTEGER NOT NULL,
                accountBalance INTEGER NOT NULL,
                accountStatus INTEGER NOT NULL,
                UNIQUE (customerId, ifscCode, accountType),
                FOREIGN KEY (customerId)
                    REFERENCES customer_Details(customerId),
                FOREIGN KEY (accountType)
                    REFERENCES account_Type(accountType),
                FOREIGN KEY (accountStatus)
                    REFERENCES account_Status(statusCode)
            ) STRICT;

            DROP TABLE customer_Account_Details;

            ALTER TABLE customer_Account_Details_new
                RENAME TO customer_Account_Details;
        `);
    }
};