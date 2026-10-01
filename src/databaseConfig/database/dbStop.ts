import type { DatabaseSync } from 'node:sqlite';

export function dbStop(database: DatabaseSync): void {
    database.close();
}