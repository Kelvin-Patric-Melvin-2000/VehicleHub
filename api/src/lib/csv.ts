export function csvEscape(value: unknown): string {
  const t = value == null ? "" : String(value);
  if (/[",\r\n]/.test(t)) return `"${t.replace(/"/g, '""')}"`;
  return t;
}

export function toCsvRow(cells: unknown[]): string {
  return cells.map(csvEscape).join(",");
}
