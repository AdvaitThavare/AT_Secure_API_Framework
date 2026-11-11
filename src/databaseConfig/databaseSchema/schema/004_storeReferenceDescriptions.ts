
import type { DatabaseSync } from 'node:sqlite';

export const storeReferenceDescriptionsSchema = {
    name: '004_storeReferenceDescriptions',

    execute(database: DatabaseSync): void {
        const existingCustomerCount = database.prepare(`
            SELECT COUNT(*) AS count
            FROM customer_Details;
        `).get() as { count: number };

        const existingAccountCount = database.prepare(`
            SELECT COUNT(*) AS count
            FROM customer_Account_Details;
        `).get() as { count: number };

        database.exec(`
            -- Rebuild customer_Details with customer status description.
            CREATE TABLE customer_Details_new (
                customerId TEXT PRIMARY KEY,
                customerFirstName TEXT NOT NULL,
                customerLastName TEXT NOT NULL,
                customerMobileNo TEXT NOT NULL UNIQUE,
                customerPAN TEXT NOT NULL UNIQUE,
                customerGender TEXT,
                customerStatus TEXT NOT NULL,

                FOREIGN KEY (customerId)
                    REFERENCES customer_Credentials(LDAP_username),

                FOREIGN KEY (customerStatus)
                    REFERENCES customer_Status(statusDescription)
            ) STRICT;

            INSERT INTO customer_Details_new (
                customerId,
                customerFirstName,
                customerLastName,
                customerMobileNo,
                customerPAN,
                customerGender,
                customerStatus
            )
            SELECT
                cd.customerId,
                cd.customerFirstName,
                cd.customerLastName,
                cd.customerMobileNo,
                cd.customerPAN,
                cd.customerGender,
                cs.statusDescription
            FROM customer_Details cd
            INNER JOIN customer_Status cs
                ON cd.customerStatus = cs.statusCode;


            -- Rebuild customer_Account_Details with account type
            -- and account status descriptions.
            CREATE TABLE customer_Account_Details_new (
                serialNo INTEGER PRIMARY KEY,
                customerId TEXT NOT NULL,
                debitAccountNo TEXT NOT NULL,
                ifscCode TEXT NOT NULL,
                accountType TEXT NOT NULL,
                accountBalance INTEGER NOT NULL,
                accountStatus TEXT NOT NULL,

                UNIQUE (customerId, ifscCode, accountType),

                FOREIGN KEY (customerId)
                    REFERENCES customer_Details_new(customerId),

                FOREIGN KEY (accountType)
                    REFERENCES account_Type(accountTypeDescription),

                FOREIGN KEY (accountStatus)
                    REFERENCES account_Status(statusDescription)
            ) STRICT;

            INSERT INTO customer_Account_Details_new (
                serialNo,
                customerId,
                debitAccountNo,
                ifscCode,
                accountType,
                accountBalance,
                accountStatus
            )
            SELECT
                cad.serialNo,
                cad.customerId,
                cad.debitAccountNo,
                cad.ifscCode,
                at.accountTypeDescription,
                cad.accountBalance,
                ast.statusDescription
            FROM customer_Account_Details cad
            INNER JOIN account_Type at
                ON cad.accountType = at.accountType
            INNER JOIN account_Status ast
                ON cad.accountStatus = ast.statusCode;


            -- Remove the old child table before the old parent table.
            DROP TABLE customer_Account_Details;
            DROP TABLE customer_Details;

            -- Replace the old tables with the rebuilt tables.
            ALTER TABLE customer_Details_new
                RENAME TO customer_Details;

            ALTER TABLE customer_Account_Details_new
                RENAME TO customer_Account_Details;


            -- Recreate the composite uniqueness index.
            -- Dropping the old account table also removed this index.
            CREATE UNIQUE INDEX
                uq_customerAccountDetails_debitAccountNo_ifscCode
            ON customer_Account_Details (
                debitAccountNo,
                ifscCode
            );
        `);

        // Ensure that no records were lost during reference conversion.
        const migratedCustomerCount = database.prepare(`
            SELECT COUNT(*) AS count
            FROM customer_Details;
        `).get() as { count: number };

        const migratedAccountCount = database.prepare(`
            SELECT COUNT(*) AS count
            FROM customer_Account_Details;
        `).get() as { count: number };

        if (
            existingCustomerCount.count !== migratedCustomerCount.count ||
            existingAccountCount.count !== migratedAccountCount.count
        ) {
            throw new Error(
                'Reference-description migration failed: record count mismatch.'
            );
        }

        // Verify that all rebuilt foreign-key relationships are valid.
        const foreignKeyViolations = database.prepare(`
            PRAGMA foreign_key_check;
        `).all();

        if (foreignKeyViolations.length > 0) {
            throw new Error(
                'Reference-description migration failed: foreign-key violations detected.'
            );
        }
    }
};
