# Offline mobile data model

SQLite database file: `vehiclehub.db` (created by `expo-sqlite`).

Schema aligns with the web/API domain types in [`app/src/types/domain.ts`](../app/src/types/domain.ts).

## Migrations

Versioned migrations live in [`mobile/src/db/migrations.ts`](../mobile/src/db/migrations.ts). The `schema_migrations` table stores applied versions.

## Tables

### `vehicles`

| Column | Type | Notes |
|--------|------|--------|
| id | TEXT PK | UUID |
| name | TEXT | Required |
| type | TEXT | Default `motorcycle` |
| make, model | TEXT | Nullable |
| year | INTEGER | Nullable |
| registration_number | TEXT | Nullable |
| current_mileage | REAL | Updated when a higher odometer is logged |
| photo_uri | TEXT | Local URI if used later |
| archived | INTEGER | 0/1 |
| created_at, updated_at | TEXT | ISO strings |

### `fuel_logs`

| Column | Type | Notes |
|--------|------|--------|
| id | TEXT PK | |
| vehicle_id | TEXT FK | → vehicles.id CASCADE |
| date | TEXT | ISO timestamp string |
| odometer_reading | REAL | |
| fuel_quantity_liters | REAL | Liters or kWh quantity |
| energy_unit | TEXT | `L` or `kWh` |
| cost | REAL | |
| fuel_station | TEXT | Nullable |
| created_at | TEXT | ISO |

### `service_records`

| Column | Type | Notes |
|--------|------|--------|
| id | TEXT PK | |
| vehicle_id | TEXT FK | → vehicles.id CASCADE |
| date | TEXT | ISO |
| odometer | REAL | Nullable |
| service_type | TEXT | |
| description | TEXT | Nullable |
| cost | REAL | |
| next_service_date | TEXT | Nullable; used for **local notifications** (09:00 that day) |
| next_service_mileage | REAL | Nullable; shown in UI only |
| created_at | TEXT | ISO |

## Backup format

JSON schema: `vehiclehub-offline-v1` — see [`mobile/src/services/backupSchema.ts`](../mobile/src/services/backupSchema.ts).
