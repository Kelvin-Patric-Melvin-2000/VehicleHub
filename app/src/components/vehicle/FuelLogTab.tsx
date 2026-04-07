import { useState } from "react";
import { useFuelLogs, useCreateFuelLog, useDeleteFuelLog, FuelLog } from "@/hooks/useFuelLogs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Fuel } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export function FuelLogTab({ vehicleId }: { vehicleId: string }) {
  const { data: logs, isLoading } = useFuelLogs(vehicleId);
  const createLog = useCreateFuelLog();
  const deleteLog = useDeleteFuelLog();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], odometer_reading: "", fuel_quantity_liters: "", cost: "", fuel_station: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createLog.mutateAsync({
        vehicle_id: vehicleId,
        date: form.date,
        odometer_reading: parseFloat(form.odometer_reading),
        fuel_quantity_liters: parseFloat(form.fuel_quantity_liters),
        cost: parseFloat(form.cost),
        fuel_station: form.fuel_station || null,
      });
      setOpen(false);
      setForm({ date: new Date().toISOString().split("T")[0], odometer_reading: "", fuel_quantity_liters: "", cost: "", fuel_station: "" });
      toast({ title: "Fuel log added!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  // Calculate fuel economy between consecutive fill-ups
  const logsWithEconomy = (logs || []).map((log, i, arr) => {
    if (i < arr.length - 1) {
      const prev = arr[i + 1];
      const distKm = log.odometer_reading - prev.odometer_reading;
      const economy = distKm > 0 ? (distKm / log.fuel_quantity_liters).toFixed(1) : null;
      return { ...log, economy };
    }
    return { ...log, economy: null };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Fuel Log</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Add Entry</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Fuel Log</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2"><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Odometer (km)</Label><Input type="number" step="0.1" placeholder="12500" value={form.odometer_reading} onChange={(e) => setForm({ ...form, odometer_reading: e.target.value })} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Fuel (L)</Label><Input type="number" step="0.01" placeholder="5.5" value={form.fuel_quantity_liters} onChange={(e) => setForm({ ...form, fuel_quantity_liters: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Cost (₹)</Label><Input type="number" step="0.01" placeholder="550" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} required /></div>
              </div>
              <div className="space-y-2"><Label>Fuel Station (optional)</Label><Input placeholder="HP Petrol Pump" value={form.fuel_station} onChange={(e) => setForm({ ...form, fuel_station: e.target.value })} /></div>
              <Button type="submit" className="w-full" disabled={createLog.isPending}>{createLog.isPending ? "Adding..." : "Add"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Card><CardContent className="h-32 animate-pulse p-4" /></Card>
      ) : logsWithEconomy.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center py-8"><Fuel className="mb-2 h-8 w-8 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">No fuel logs yet</p></CardContent></Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Odometer</TableHead>
                  <TableHead>Fuel (L)</TableHead>
                  <TableHead>Cost (₹)</TableHead>
                  <TableHead>km/L</TableHead>
                  <TableHead>Station</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logsWithEconomy.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{format(parseISO(log.date), "MMM dd, yy")}</TableCell>
                    <TableCell>{Number(log.odometer_reading).toLocaleString()}</TableCell>
                    <TableCell>{log.fuel_quantity_liters}</TableCell>
                    <TableCell>₹{Number(log.cost).toLocaleString()}</TableCell>
                    <TableCell className={log.economy ? "font-medium text-[hsl(142,71%,45%)]" : "text-muted-foreground"}>
                      {log.economy || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{log.fuel_station || "—"}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                        onClick={() => deleteLog.mutate({ id: log.id, vehicleId })}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
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
