import { useMemo, useState, useEffect, useRef } from "react";
import { useFuelLogs, useCreateFuelLog, useDeleteFuelLog, useImportFuelLogs } from "@/hooks/useFuelLogs";
import type { EnergyUnit } from "@/types/domain";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Fuel, AlertTriangle, Upload } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";

function defaultEnergyUnit(vehicleType: string): EnergyUnit {
  return vehicleType === "electric_car" ? "kWh" : "L";
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!;
    if (c === '"') {
      if (inQ && line[i + 1] === '"') {
        cur += '"';
        i++;
        continue;
      }
      inQ = !inQ;
      continue;
    }
    if (!inQ && c === ",") {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function parseFuelCsvExport(text: string) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) throw new Error("Need a header row and at least one data row.");
  const header = parseCsvLine(lines[0]!).map((h) => h.replace(/^\uFEFF/, "").toLowerCase());
  const findCol = (names: string[]) => {
    for (const n of names) {
      const i = header.indexOf(n);
      if (i >= 0) return i;
    }
    return -1;
  };
  const iDate = findCol(["date"]);
  const iOdo = findCol(["odometer_km", "odometer"]);
  const iQty = findCol(["quantity"]);
  const iCost = findCol(["cost"]);
  const iUnit = findCol(["unit"]);
  const iStat = findCol(["station"]);
  if (iDate < 0 || iOdo < 0 || iQty < 0 || iCost < 0) {
    throw new Error("CSV must include: date, odometer_km (or odometer), quantity, cost");
  }
  const rows: {
    date: string;
    odometer_reading: number;
    fuel_quantity_liters: number;
    cost: number;
    energy_unit: "L" | "kWh";
    fuel_station: string | null;
  }[] = [];
  for (let li = 1; li < lines.length; li++) {
    const cells = parseCsvLine(lines[li]!);
    const u = iUnit >= 0 ? cells[iUnit]?.trim().toLowerCase() : "";
    const energy_unit: "L" | "kWh" = u === "kwh" ? "kWh" : "L";
    rows.push({
      date: cells[iDate]!.slice(0, 10),
      odometer_reading: parseFloat(cells[iOdo]!),
      fuel_quantity_liters: parseFloat(cells[iQty]!),
      cost: parseFloat(cells[iCost]!),
      energy_unit,
      fuel_station: iStat >= 0 && cells[iStat] ? cells[iStat] : null,
    });
  }
  return rows;
}

export function FuelLogTab({
  vehicleId,
  vehicleType,
  readOnly = false,
}: {
  vehicleId: string;
  vehicleType: string;
  readOnly?: boolean;
}) {
  const { data: logs, isLoading } = useFuelLogs(vehicleId);
  const createLog = useCreateFuelLog();
  const importLogs = useImportFuelLogs();
  const deleteLog = useDeleteFuelLog();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    odometer_reading: "",
    fuel_quantity_liters: "",
    cost: "",
    fuel_station: "",
    energy_unit: defaultEnergyUnit(vehicleType) as EnergyUnit,
  });

  const unitLocked = useMemo((): EnergyUnit | null => {
    if (!logs?.length) return null;
    const sorted = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return sorted[0]!.energy_unit === "kWh" ? "kWh" : "L";
  }, [logs]);

  useEffect(() => {
    if (unitLocked) {
      setForm((f) => ({ ...f, energy_unit: unitLocked }));
    }
  }, [unitLocked]);

  const effectiveUnit = unitLocked ?? form.energy_unit;
  const liquid = effectiveUnit === "L";
  const economyLabel = liquid ? "km/L" : "km/kWh";
  const qtyHeader = liquid ? "Fuel (L)" : "Energy (kWh)";
  const priceHeader = liquid ? "₹/L" : "₹/kWh";

  const resetForm = () => {
    setForm({
      date: new Date().toISOString().split("T")[0],
      odometer_reading: "",
      fuel_quantity_liters: "",
      cost: "",
      fuel_station: "",
      energy_unit: unitLocked ?? defaultEnergyUnit(vehicleType),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await createLog.mutateAsync({
        vehicle_id: vehicleId,
        date: form.date,
        odometer_reading: parseFloat(form.odometer_reading),
        fuel_quantity_liters: parseFloat(form.fuel_quantity_liters),
        energy_unit: effectiveUnit,
        cost: parseFloat(form.cost),
        fuel_station: form.fuel_station || null,
      });
      setOpen(false);
      resetForm();
      toast({ title: liquid ? "Fuel log added!" : "Charging log added!" });
      if (created.warnings?.length) {
        created.warnings.forEach((w) =>
          toast({ title: "Check odometer", description: w, variant: "destructive" }),
        );
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  const sortedDesc = useMemo(() => {
    if (!logs?.length) return [];
    return [...logs].sort(
      (a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime() ||
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [logs]);

  const logsWithEconomy = sortedDesc.map((log, i, arr) => {
    const older = arr[i + 1];
    const odometerOutOfOrder =
      older != null && log.odometer_reading < older.odometer_reading;
    if (i < arr.length - 1) {
      const prev = arr[i + 1]!;
      const distKm = log.odometer_reading - prev.odometer_reading;
      const economy =
        distKm > 0 && log.fuel_quantity_liters > 0
          ? (distKm / log.fuel_quantity_liters).toFixed(1)
          : null;
      const pricePerUnit =
        log.fuel_quantity_liters > 0 ? (log.cost / log.fuel_quantity_liters).toFixed(2) : null;
      return { ...log, economy, pricePerUnit, odometerOutOfOrder };
    }
    return {
      ...log,
      economy: null as string | null,
      pricePerUnit:
        log.fuel_quantity_liters > 0 ? (log.cost / log.fuel_quantity_liters).toFixed(2) : null,
      odometerOutOfOrder,
    };
  });

  const dialogTitle = liquid ? "Add fuel log" : "Add charging log";
  const sectionTitle = logs?.length ? (liquid ? "Fuel log" : "Charging log") : "Fuel & energy log";

  const onImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      const text = await f.text();
      const rows = parseFuelCsvExport(text);
      const r = await importLogs.mutateAsync({ vehicle_id: vehicleId, rows });
      toast({ title: `Imported ${r.imported} fill(s)` });
    } catch (err: unknown) {
      toast({
        title: "Import failed",
        description: err instanceof Error ? err.message : "Could not import CSV",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold" style={{ fontFamily: "Rajdhani, sans-serif" }}>
          {sectionTitle}
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={onImportFile}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={readOnly || importLogs.isPending}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            Import CSV
          </Button>
        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5" disabled={readOnly}>
              <Plus className="h-4 w-4" /> Add Entry
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{dialogTitle}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Odometer (km)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="12500"
                  value={form.odometer_reading}
                  onChange={(e) => setForm({ ...form, odometer_reading: e.target.value })}
                  required
                />
              </div>
              {!unitLocked && (
                <div className="space-y-2">
                  <Label>Energy unit</Label>
                  <Select
                    value={form.energy_unit}
                    onValueChange={(v) => setForm({ ...form, energy_unit: v as EnergyUnit })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L">Liters (petrol / diesel)</SelectItem>
                      <SelectItem value="kWh">kWh (electric)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{liquid ? "Fuel (L)" : "Energy (kWh)"}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder={liquid ? "5.5" : "18"}
                    value={form.fuel_quantity_liters}
                    onChange={(e) => setForm({ ...form, fuel_quantity_liters: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cost (₹)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="550"
                    value={form.cost}
                    onChange={(e) => setForm({ ...form, cost: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{liquid ? "Station (optional)" : "Location / charger (optional)"}</Label>
                <Input
                  placeholder={liquid ? "HP Petrol Pump" : "Home AC charger"}
                  value={form.fuel_station}
                  onChange={(e) => setForm({ ...form, fuel_station: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full" disabled={createLog.isPending}>
                {createLog.isPending ? "Adding..." : "Add"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="h-32 animate-pulse p-4" />
        </Card>
      ) : logsWithEconomy.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-8">
            <Fuel className="mb-2 h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No fuel or charging logs yet</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Odometer</TableHead>
                  <TableHead>{qtyHeader}</TableHead>
                  <TableHead>Cost (₹)</TableHead>
                  <TableHead>{priceHeader}</TableHead>
                  <TableHead>{economyLabel}</TableHead>
                  <TableHead>{liquid ? "Station" : "Location"}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {logsWithEconomy.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{format(parseISO(log.date), "MMM dd, yy")}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5">
                        {log.odometerOutOfOrder && (
                          <AlertTriangle
                            className="h-3.5 w-3.5 shrink-0 text-[hsl(38,92%,50%)]"
                            title="Odometer is lower than an older log — check readings"
                          />
                        )}
                        {Number(log.odometer_reading).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>{log.fuel_quantity_liters}</TableCell>
                    <TableCell>₹{Number(log.cost).toLocaleString()}</TableCell>
                    <TableCell>{log.pricePerUnit != null ? `₹${log.pricePerUnit}` : "—"}</TableCell>
                    <TableCell
                      className={
                        log.economy ? "font-medium text-[hsl(142,71%,45%)]" : "text-muted-foreground"
                      }
                    >
                      {log.economy || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{log.fuel_station || "—"}</TableCell>
                    <TableCell>
                      {!readOnly && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => deleteLog.mutate({ id: log.id, vehicleId })}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
