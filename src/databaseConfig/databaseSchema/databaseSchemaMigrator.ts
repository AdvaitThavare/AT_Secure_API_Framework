import type { DatabaseSync } from 'node:sqlite';
import { dbStart } from '../database/dbStart';
import { dbStop } from '../database/dbStop';
import { initialSchema } from './schema/000_initialSchema';
import { addOrUpdateCustomerSchema } from './schema/001_addOrUpdateCustomer';

type SchemaMigration = {
    name: string;
    execute: (database: DatabaseSync) => void;
};

const schemaMigrations: SchemaMigration[] = [
    initialSchema,
    addOrUpdateCustomerSchema
];

function getSchemaVersion(database: DatabaseSync): number {
    const result = database.prepare('PRAGMA user_version').get() as { user_version: number };
    return result.user_version;
}

function setSchemaVersion(
    database: DatabaseSync,
    version: number
): void {
    database.exec(`PRAGMA user_version = ${version}`);
}

export function migrateDatabase(database: DatabaseSync): void {
    const currentVersion = getSchemaVersion(database);

    if (currentVersion > schemaMigrations.length) {
        throw new Error(
            `Database schema version ${currentVersion} is newer than the application supports.`
        );
    }

    for (
        let migrationIndex = currentVersion;
        migrationIndex < schemaMigrations.length;
        migrationIndex += 1
    ) {
        const migration = schemaMigrations[migrationIndex];
        const targetVersion = migrationIndex + 1;

        database.exec('BEGIN');

        try {
            migration.execute(database);
            setSchemaVersion(database, targetVersion);
            database.exec('COMMIT');

            console.log(
                `Database migration applied: ${migration.name}`
            );
        } catch (error) {
            database.exec('ROLLBACK');
            throw error;
        }
    }
}

export function runDatabaseSchemaMigration(): void {
    const database = dbStart();

    try {
        migrateDatabase(database);
    } finally {
        dbStop(database);
    }
}