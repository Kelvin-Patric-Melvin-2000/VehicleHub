import { useVehicles } from "@/hooks/useVehicles";
import { useAllServiceRecords } from "@/hooks/useServiceRecords";
import { useAllDocuments } from "@/hooks/useDocuments";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Bike, Fuel, Wrench, FileText, AlertTriangle, Plus, ChevronRight } from "lucide-react";
import { differenceInDays, format, parseISO } from "date-fns";

function getUrgencyColor(daysUntil: number) {
  if (daysUntil < 0) return "bg-destructive text-destructive-foreground";
  if (daysUntil <= 7) return "bg-[hsl(38,92%,50%)] text-[hsl(222,47%,6%)]";
  if (daysUntil <= 30) return "bg-[hsl(38,92%,50%)]/80 text-[hsl(222,47%,6%)]";
  return "bg-[hsl(142,71%,45%)] text-[hsl(222,47%,6%)]";
}

function getUrgencyLabel(daysUntil: number) {
  if (daysUntil < 0) return `${Math.abs(daysUntil)}d overdue`;
  if (daysUntil === 0) return "Due today";
  return `${daysUntil}d left`;
}

export default function Dashboard() {
  const { data: vehicles, isLoading: loadingVehicles } = useVehicles();
  const { data: serviceRecords } = useAllServiceRecords();
  const { data: documents } = useAllDocuments();

  const today = new Date();

  const upcomingServices = (serviceRecords || [])
    .filter((r: any) => r.next_service_date)
    .map((r: any) => ({
      ...r,
      daysUntil: differenceInDays(parseISO(r.next_service_date), today),
      vehicleName: r.vehicles?.name || "Unknown",
    }))
    .filter((r: any) => r.daysUntil <= 30)
    .sort((a: any, b: any) => a.daysUntil - b.daysUntil)
    .slice(0, 5);

  const expiringDocs = (documents || [])
    .filter((d: any) => d.expiry_date)
    .map((d: any) => ({
      ...d,
      daysUntil: differenceInDays(parseISO(d.expiry_date), today),
      vehicleName: d.vehicles?.name || "Unknown",
    }))
    .filter((d: any) => d.daysUntil <= 30)
    .sort((a: any, b: any) => a.daysUntil - b.daysUntil);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              Dashboard
            </h1>
            <p className="text-muted-foreground">Your vehicle health at a glance</p>
          </div>
          <Link to="/add-vehicle">
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add Vehicle
            </Button>
          </Link>
        </div>

        {/* Expiring Documents Alert */}
        {expiringDocs.length > 0 && (
          <Card className="border-[hsl(38,92%,50%)]/30 bg-[hsl(38,92%,50%)]/5">
            <CardContent className="flex items-start gap-3 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-[hsl(38,92%,50%)]" />
              <div>
                <p className="font-semibold text-[hsl(38,92%,50%)]">Document Expiry Alert</p>
                <p className="text-sm text-muted-foreground">
                  {expiringDocs.length} document(s) expiring within 30 days
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Row */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Bike className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{vehicles?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Vehicles</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(38,92%,50%)]/10">
                <Wrench className="h-5 w-5 text-[hsl(38,92%,50%)]" />
              </div>
              <div>
                <p className="text-2xl font-bold">{upcomingServices.length}</p>
                <p className="text-sm text-muted-foreground">Upcoming Services</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <FileText className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{expiringDocs.filter((d: any) => d.daysUntil < 0).length}</p>
                <p className="text-sm text-muted-foreground">Expired Docs</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vehicle Cards */}
        <div>
          <h2 className="mb-3 text-xl font-semibold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Your Vehicles</h2>
          {loadingVehicles ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="h-32 p-4" />
                </Card>
              ))}
            </div>
          ) : vehicles && vehicles.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {vehicles.map((v) => (
                <Link key={v.id} to={`/vehicle/${v.id}`}>
                  <Card className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                            <Bike className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">{v.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {[v.make, v.model, v.year].filter(Boolean).join(" · ") || v.type}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Fuel className="h-3.5 w-3.5" />
                          {Number(v.current_mileage).toLocaleString()} km
                        </span>
                        {v.registration_number && (
                          <Badge variant="outline" className="text-xs">
                            {v.registration_number}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bike className="mb-4 h-12 w-12 text-muted-foreground/30" />
                <p className="text-muted-foreground">No vehicles added yet</p>
                <Link to="/add-vehicle">
                  <Button variant="outline" className="mt-4 gap-2">
                    <Plus className="h-4 w-4" /> Add your first vehicle
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Upcoming Services */}
        {upcomingServices.length > 0 && (
          <div>
            <h2 className="mb-3 text-xl font-semibold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              Upcoming Service Reminders
            </h2>
            <div className="space-y-2">
              {upcomingServices.map((s: any) => (
                <Card key={s.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <Wrench className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{s.service_type}</p>
                        <p className="text-sm text-muted-foreground">
                          {s.vehicleName} · Due {format(parseISO(s.next_service_date), "MMM dd, yyyy")}
                        </p>
                      </div>
                    </div>
                    <Badge className={getUrgencyColor(s.daysUntil)}>
                      {getUrgencyLabel(s.daysUntil)}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
