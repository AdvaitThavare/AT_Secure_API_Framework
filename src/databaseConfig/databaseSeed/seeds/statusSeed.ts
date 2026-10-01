import type { DatabaseSync } from 'node:sqlite';

export function seedStatusData(database: DatabaseSync): void {
    database.exec(`
        INSERT OR IGNORE INTO customer_Status (
            statusCode,
            statusDescription
        )
        VALUES
            (1, 'ACTIVE'),
            (2, 'INACTIVE');

        INSERT OR IGNORE INTO account_Status (
            statusCode,
            statusDescription
        )
        VALUES
            (1, 'ACTIVE'),
            (2, 'INACTIVE'),
            (3, 'CLOSED'),
            (4, 'BLOCKED');
    `);
}