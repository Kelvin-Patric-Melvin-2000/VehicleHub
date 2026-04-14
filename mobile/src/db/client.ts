import * as SQLite from "expo-sqlite";
import { runMigrations } from "./migrations";

let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<void> | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync("vehiclehub.db");
  }
  return db;
}

export async function initDb(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const database = getDb();
    await database.execAsync("PRAGMA foreign_keys = ON;");
    await runMigrations(database);
  })();
  return initPromise;
}
