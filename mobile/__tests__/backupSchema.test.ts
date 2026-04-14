import { describe, expect, it } from "vitest";
import { parseBackupJson } from "../src/services/backupSchema";

describe("parseBackupJson", () => {
  it("accepts empty backup payload", () => {
    const json = JSON.stringify({
      format: "vehiclehub-offline-v1",
      exportedAt: new Date().toISOString(),
      vehicles: [],
      fuel_logs: [],
      service_records: [],
    });
    const r = parseBackupJson(json);
    expect(r.vehicles).toEqual([]);
    expect(r.fuel_logs).toEqual([]);
    expect(r.service_records).toEqual([]);
  });

  it("rejects wrong format", () => {
    const json = JSON.stringify({ format: "other", exportedAt: "", vehicles: [], fuel_logs: [], service_records: [] });
    expect(() => parseBackupJson(json)).toThrow();
  });
});
