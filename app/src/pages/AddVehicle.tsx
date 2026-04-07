import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateVehicle } from "@/hooks/useVehicles";
import { useToast } from "@/hooks/use-toast";

export default function AddVehicle() {
  const navigate = useNavigate();
  const createVehicle = useCreateVehicle();
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: "",
    type: "motorcycle",
    make: "",
    model: "",
    year: "",
    registration_number: "",
    current_mileage: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createVehicle.mutateAsync({
        name: form.name,
        type: form.type,
        make: form.make || null,
        model: form.model || null,
        year: form.year ? parseInt(form.year) : null,
        registration_number: form.registration_number || null,
        current_mileage: parseFloat(form.current_mileage) || 0,
        photo_url: null,
      });
      toast({ title: "Vehicle added!" });
      navigate("/");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-xl">
        <h1 className="mb-6 text-3xl font-bold tracking-tight" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
          Add Vehicle
        </h1>
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Vehicle Name *</Label>
                <Input
                  placeholder="e.g. My Honda Activa"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="motorcycle">Motorcycle</SelectItem>
                    <SelectItem value="scooter">Scooter</SelectItem>
                    <SelectItem value="bike">Bike</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Make</Label>
                  <Input placeholder="Honda" value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Input placeholder="Activa 6G" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input type="number" placeholder="2023" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Current Mileage (km)</Label>
                  <Input type="number" placeholder="5000" value={form.current_mileage} onChange={(e) => setForm({ ...form, current_mileage: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Registration Number</Label>
                <Input placeholder="MH 01 AB 1234" value={form.registration_number} onChange={(e) => setForm({ ...form, registration_number: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate("/")} className="flex-1">Cancel</Button>
                <Button type="submit" className="flex-1" disabled={createVehicle.isPending}>
                  {createVehicle.isPending ? "Adding..." : "Add Vehicle"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
