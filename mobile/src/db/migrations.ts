import type { SQLiteDatabase } from "expo-sqlite";

const MIGRATIONS: Record<number, string> = {
  1: `
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS vehicles (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'motorcycle',
      make TEXT,
      model TEXT,
      year INTEGER,
      registration_number TEXT,
      current_mileage REAL NOT NULL DEFAULT 0,
      photo_uri TEXT,
      archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_vehicles_archived ON vehicles(archived);

    CREATE TABLE IF NOT EXISTS fuel_logs (
      id TEXT PRIMARY KEY NOT NULL,
      vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      odometer_reading REAL NOT NULL,
      fuel_quantity_liters REAL NOT NULL,
      energy_unit TEXT NOT NULL CHECK(energy_unit IN ('L','kWh')),
      cost REAL NOT NULL,
      fuel_station TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_fuel_vehicle ON fuel_logs(vehicle_id);
    CREATE INDEX IF NOT EXISTS idx_fuel_date ON fuel_logs(date);

    CREATE TABLE IF NOT EXISTS service_records (
      id TEXT PRIMARY KEY NOT NULL,
      vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      odometer REAL,
      service_type TEXT NOT NULL,
      description TEXT,
      cost REAL NOT NULL DEFAULT 0,
      next_service_date TEXT,
      next_service_mileage REAL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_service_vehicle ON service_records(vehicle_id);
    CREATE INDEX IF NOT EXISTS idx_service_date ON service_records(date);
  `,
};

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY NOT NULL
    );
  `);

  const row = await db.getFirstAsync<{ version: number | null }>(
    "SELECT MAX(version) as version FROM schema_migrations",
  );
  let current = 0;
  if (row && row.version != null && typeof row.version === "number" && !Number.isNaN(row.version)) {
    current = row.version;
  }

  const versions = Object.keys(MIGRATIONS)
    .map(Number)
    .sort((a, b) => a - b);

  for (const v of versions) {
    if (v <= current) continue;
    const sql = MIGRATIONS[v];
    if (!sql) continue;
    await db.execAsync(sql);
    await db.runAsync("INSERT INTO schema_migrations (version) VALUES (?)", [v]);
    current = v;
  }
}
