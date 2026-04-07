import { useState } from "react";
import { useServiceRecords, useCreateServiceRecord, useDeleteServiceRecord } from "@/hooks/useServiceRecords";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Wrench } from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export function ServiceTab({ vehicleId }: { vehicleId: string }) {
  const { data: records, isLoading } = useServiceRecords(vehicleId);
  const createRecord = useCreateServiceRecord();
  const deleteRecord = useDeleteServiceRecord();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    odometer: "", service_type: "", description: "", cost: "",
    next_service_date: "", next_service_mileage: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createRecord.mutateAsync({
        vehicle_id: vehicleId,
        date: form.date,
        odometer: form.odometer ? parseFloat(form.odometer) : null,
        service_type: form.service_type,
        description: form.description || null,
        cost: parseFloat(form.cost) || 0,
        next_service_date: form.next_service_date || null,
        next_service_mileage: form.next_service_mileage ? parseFloat(form.next_service_mileage) : null,
      });
      setOpen(false);
      setForm({ date: new Date().toISOString().split("T")[0], odometer: "", service_type: "", description: "", cost: "", next_service_date: "", next_service_mileage: "" });
      toast({ title: "Service record added!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Service History</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Add Record</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Service Record</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Odometer (km)</Label><Input type="number" value={form.odometer} onChange={(e) => setForm({ ...form, odometer: e.target.value })} /></div>
              </div>
              <div className="space-y-2"><Label>Service Type *</Label><Input placeholder="Oil Change, Tyre Replace..." value={form.service_type} onChange={(e) => setForm({ ...form, service_type: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea placeholder="Details about the service" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="space-y-2"><Label>Cost (₹)</Label><Input type="number" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Next Service Date</Label><Input type="date" value={form.next_service_date} onChange={(e) => setForm({ ...form, next_service_date: e.target.value })} /></div>
                <div className="space-y-2"><Label>Next Service km</Label><Input type="number" value={form.next_service_mileage} onChange={(e) => setForm({ ...form, next_service_mileage: e.target.value })} /></div>
              </div>
              <Button type="submit" className="w-full" disabled={createRecord.isPending}>{createRecord.isPending ? "Adding..." : "Add"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Card><CardContent className="h-32 animate-pulse p-4" /></Card>
      ) : (records || []).length === 0 ? (
        <Card><CardContent className="flex flex-col items-center py-8"><Wrench className="mb-2 h-8 w-8 text-muted-foreground/30" /><p className="text-sm text-muted-foreground">No service records yet</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {(records || []).map((r) => {
            const daysUntilNext = r.next_service_date ? differenceInDays(parseISO(r.next_service_date), new Date()) : null;
            return (
              <Card key={r.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{r.service_type}</p>
                        {r.cost > 0 && <Badge variant="outline">₹{Number(r.cost).toLocaleString()}</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(r.date), "MMM dd, yyyy")}
                        {r.odometer && ` · ${Number(r.odometer).toLocaleString()} km`}
                      </p>
                      {r.description && <p className="text-sm text-muted-foreground">{r.description}</p>}
                      {r.next_service_date && (
                        <p className="text-xs">
                          Next service: {format(parseISO(r.next_service_date), "MMM dd, yyyy")}
                          {daysUntilNext !== null && (
                            <Badge className={`ml-2 ${daysUntilNext < 0 ? "bg-destructive" : daysUntilNext <= 7 ? "bg-[hsl(38,92%,50%)]" : "bg-[hsl(142,71%,45%)]"} text-[hsl(222,47%,6%)]`}>
                              {daysUntilNext < 0 ? `${Math.abs(daysUntilNext)}d overdue` : `${daysUntilNext}d left`}
                            </Badge>
                          )}
                        </p>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteRecord.mutate({ id: r.id, vehicleId })}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
