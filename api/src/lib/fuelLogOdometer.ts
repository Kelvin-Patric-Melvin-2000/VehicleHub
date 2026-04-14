/** Max km between consecutive fills before we attach a soft warning (typo / unit mix-up). */
export const MAX_ODOMETER_JUMP_KM = 4000;

type LogPoint = {
  date: Date;
  odometer_reading: number;
  created_at: Date;
  isNew: boolean;
};

export function validateNewFuelLogOdometer(
  existing: { date: Date; odometer_reading: number; created_at: Date }[],
  newDate: Date,
  newOdometer: number,
  prospectiveCreatedAt: Date,
): { ok: true; warnings: string[] } | { ok: false; error: string } {
  const points: LogPoint[] = [
    ...existing.map((e) => ({
      date: e.date,
      odometer_reading: e.odometer_reading,
      created_at: e.created_at,
      isNew: false,
    })),
    {
      date: newDate,
      odometer_reading: newOdometer,
      created_at: prospectiveCreatedAt,
      isNew: true,
    },
  ];

  points.sort((a, b) => {
    const td = a.date.getTime() - b.date.getTime();
    if (td !== 0) return td;
    const tc = a.created_at.getTime() - b.created_at.getTime();
    if (tc !== 0) return tc;
    return a.isNew ? 1 : -1;
  });

  const warnings: string[] = [];

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]!;
    const cur = points[i]!;
    if (cur.odometer_reading < prev.odometer_reading) {
      return {
        ok: false,
        error:
          "Odometer cannot be lower than a previous reading for this vehicle (check date or reading).",
      };
    }
    if (cur.isNew && cur.odometer_reading - prev.odometer_reading > MAX_ODOMETER_JUMP_KM) {
      warnings.push(
        `Large odometer jump (${cur.odometer_reading - prev.odometer_reading} km vs previous fill). Verify the reading.`,
      );
    }
  }

  return { ok: true, warnings };
}
