
import type { DatabaseSync } from 'node:sqlite';

export const addDebitAccountIfscUniquenessSchema = {
    name: '003_addDebitAccountIfscUniqueness',

    execute(database: DatabaseSync): void {
        database.exec(`
            CREATE UNIQUE INDEX uq_customerAccountDetails_debitAccountNo_ifscCode
            ON customer_Account_Details (
                debitAccountNo,
                ifscCode
            );
        `);
    }
};
