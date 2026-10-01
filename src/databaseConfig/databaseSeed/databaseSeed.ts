import type { DatabaseSync } from 'node:sqlite';
import { dbStart } from '../database/dbStart';
import { dbStop } from '../database/dbStop';
import { seedStatusData } from './seeds/statusSeed';
import { seedCredentialData } from './seeds/credentialSeed';

export function seedDatabase(database: DatabaseSync): void {
    database.exec('BEGIN');

    try {
        seedStatusData(database);
        seedCredentialData(database);

        database.exec('COMMIT');
    } catch (error) {
        database.exec('ROLLBACK');
        throw error;
    }
}

export function runDatabaseSeed(): void {
    const database = dbStart();

    try {
        seedDatabase(database);
    } finally {
        dbStop(database);
    }
}