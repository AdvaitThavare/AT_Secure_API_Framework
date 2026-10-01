import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const databaseDirectory = path.resolve(process.cwd(), 'database');
const databasePath = path.join(databaseDirectory, 'customer.db');

export function dbStart(): DatabaseSync {
    fs.mkdirSync(databaseDirectory, { recursive: true });

    const database = new DatabaseSync(databasePath);

    database.exec('PRAGMA foreign_keys = ON;');

    return database;
}