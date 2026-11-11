import type { DatabaseSync } from 'node:sqlite';

export const splitCustomerNameSchema = {
    name: '002_splitCustomerName',

    execute(database: DatabaseSync): void {
        const customerCountRow = database.prepare(`
            SELECT COUNT(*) AS customerCount
            FROM customer_Details;
        `).get() as { customerCount: number };

        if (customerCountRow.customerCount > 0) {
            throw new Error(
                'Cannot automatically split existing customerName values. ' +
                'An explicit first-name and last-name data migration is required.'
            );
        }

        database.exec(`
            CREATE TABLE customer_Details_new (
                customerId TEXT PRIMARY KEY,
                customerFirstName TEXT NOT NULL,
                customerLastName TEXT NOT NULL,
                customerMobileNo TEXT NOT NULL UNIQUE,
                customerPAN TEXT NOT NULL UNIQUE,
                customerGender TEXT,
                customerStatus INTEGER NOT NULL,
                FOREIGN KEY (customerId)
                    REFERENCES customer_Credentials(LDAP_username),
                FOREIGN KEY (customerStatus)
                    REFERENCES customer_Status(statusCode)
            ) STRICT;

            DROP TABLE customer_Details;

            ALTER TABLE customer_Details_new
                RENAME TO customer_Details;
        `);
    }
};