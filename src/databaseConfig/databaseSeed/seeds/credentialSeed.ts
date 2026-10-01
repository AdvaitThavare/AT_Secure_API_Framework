import type { DatabaseSync } from 'node:sqlite';

export function seedCredentialData(database: DatabaseSync): void {
    database.exec(`
        INSERT OR IGNORE INTO customer_Credentials (
            LDAP_username,
            LDAP_password
        )
        VALUES
            ('atecho', '12345678'),
            ('CUST000001', 'CUST-PASS-001'),
            ('CUST000002', 'CUST-PASS-002'),
            ('CUST000003', 'CUST-PASS-003');
    `);
}