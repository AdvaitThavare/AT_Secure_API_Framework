import type { DatabaseSync } from 'node:sqlite';

export function seedAccountTypeData(database: DatabaseSync): void {
    database.exec(`
        INSERT OR IGNORE INTO account_Type (
            accountType,
            accountTypeDescription
        )
        VALUES
            (1, 'SAVINGS'),
            (2, 'CURRENT');
    `);
}