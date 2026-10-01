import { dbStart } from "./database/dbStart";
import { dbStop } from "./database/dbStop";
import { migrateDatabase } from "./databaseSchema/databaseSchemaMigrator";
import { seedDatabase } from "./databaseSeed/databaseSeed";

export function databaseSetup(): void {
    const database = dbStart();

    try {
        migrateDatabase(database);
        seedDatabase(database);
    } finally {
        dbStop(database);
    }
}