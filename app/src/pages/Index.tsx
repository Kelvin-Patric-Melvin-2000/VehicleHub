import { useMemo, useEffect } from "react";
import { useVehicles } from "@/hooks/useVehicles";
import { useAllServiceRecords } from "@/hooks/useServiceRecords";
import { useAllDocuments } from "@/hooks/useDocuments";
import { useFleetFuelAnalytics } from "@/hooks/useFleetFuelAnalytics";
import { useFleetSummary } from "@/hooks/useFleetSummary";
import { useFuelPriceIndicative } from "@/hooks/useFuelPriceIndicative";
import { useVehicleTypes } from "@/hooks/useVehicleTypes";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useSearchParams } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bike, Fuel, Wrench, FileText, AlertTriangle, Plus, ChevronRight, BarChart3, Receipt, Search } from "lucide-react";
import { VehicleTypeIcon } from "@/components/vehicle/VehicleTypeIcon";
import { ExportMenu } from "@/components/ExportMenu";
import { differenceInDays, format, parseISO } from "date-fns";
import type { Vehicle } from "@/types/domain";

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
  const [searchParams, setSearchParams] = useSearchParams();
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const typeFilter = searchParams.get("type") ?? "all";
  const attentionOnly = searchParams.get("attention") === "1";

  const { data: vehicles, isLoading: loadingVehicles } = useVehicles();
  const { data: serviceRecords } = useAllServiceRecords();
  const { data: documents } = useAllDocuments();
  const { data: fleetFuel, isLoading: loadingFleetFuel } = useFleetFuelAnalytics();
  const { data: fleetSummary, isLoading: loadingFleetSummary } = useFleetSummary();
  const { data: fuelPriceIndicative, isLoading: loadingFuelPrice } = useFuelPriceIndicative();
  const { data: vehicleTypes = [] } = useVehicleTypes();

  const today = new Date();

  const attentionVehicleIds = useMemo(() => {
    if (fleetSummary) {
      return new Set(fleetSummary.attentionVehicleIds);
    }
    const ids = new Set<string>();
    (serviceRecords || []).forEach((r) => {
      if (!r.next_service_date) return;
      const days = differenceInDays(parseISO(r.next_service_date), today);
      if (days <= 30) ids.add(r.vehicle_id);
    });
    (documents || []).forEach((d) => {
      if (!d.expiry_date) return;
      const days = differenceInDays(parseISO(d.expiry_date), today);
      if (days <= 30) ids.add(d.vehicle_id);
    });
    return ids;
  }, [fleetSummary, serviceRecords, documents, today]);

  const filteredVehicles = useMemo(() => {
    let list: Vehicle[] = vehicles ?? [];
    if (typeFilter !== "all") {
      list = list.filter((v) => v.type === typeFilter);
    }
    if (attentionOnly) {
      list = list.filter((v) => attentionVehicleIds.has(v.id));
    }
    if (q) {
      list = list.filter((v) => {
        const name = v.name.toLowerCase();
        const reg = (v.registration_number ?? "").toLowerCase();
        const make = (v.make ?? "").toLowerCase();
        const model = (v.model ?? "").toLowerCase();
        return name.includes(q) || reg.includes(q) || make.includes(q) || model.includes(q);
      });
    }
    return list;
  }, [vehicles, typeFilter, attentionOnly, attentionVehicleIds, q]);

  useEffect(() => {
    const t = searchParams.get("type");
    if (t && t !== "all" && vehicleTypes.length && !vehicleTypes.some((vt) => vt.slug === t)) {
      const next = new URLSearchParams(searchParams);
      next.delete("type");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, vehicleTypes, setSearchParams]);

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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              Dashboard
            </h1>
            <p className="text-muted-foreground">Your vehicle health at a glance</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ExportMenu fleetSummary={fleetSummary} fleetFuel={fleetFuel} />
            <Link to="/add-vehicle">
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Add Vehicle
              </Button>
            </Link>
          </div>
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
                <p className="text-2xl font-bold">
                  {loadingFleetSummary ? "…" : fleetSummary?.upcomingServicesCount ?? upcomingServices.length}
                </p>
                <p className="text-sm text-muted-foreground">Upcoming Services (30d)</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <FileText className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {loadingFleetSummary ? "…" : fleetSummary?.expiredDocumentsCount ?? expiringDocs.filter((d: any) => d.daysUntil < 0).length}
                </p>
                <p className="text-sm text-muted-foreground">Expired Docs</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cross-vehicle fuel (all vehicles) */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Fuel className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {loadingFleetFuel ? "…" : `₹${(fleetFuel?.thisMonthFuelCost ?? 0).toLocaleString()}`}
                </p>
                <p className="text-sm text-muted-foreground">Energy spend this month (all vehicles)</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {loadingFleetFuel
                    ? "…"
                    : fleetFuel?.avgKmPerL != null
                      ? `${fleetFuel.avgKmPerL} km/L`
                      : "—"}
                </p>
                <p className="text-sm text-muted-foreground">Fleet avg economy (liquid fills)</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Receipt className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {loadingFleetFuel
                    ? "…"
                    : fleetFuel?.avgPricePerLiter != null
                      ? `₹${fleetFuel.avgPricePerLiter}`
                      : "—"}
                </p>
                <p className="text-sm text-muted-foreground">Avg ₹/L (liquid fills)</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {!loadingFuelPrice && fuelPriceIndicative?.pricePerLiter != null && (
          <p className="text-xs text-muted-foreground">
            Cached indicative fuel price: ₹{fuelPriceIndicative.pricePerLiter.toFixed(2)}/L
            {fuelPriceIndicative.updatedAt && (
              <span className="ml-1">(updated {format(parseISO(fuelPriceIndicative.updatedAt), "MMM d, yyyy")})</span>
            )}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Receipt className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {loadingFleetSummary
                      ? "…"
                      : `₹${(fleetSummary?.totalCostOfOwnership ?? 0).toLocaleString()}`}
                  </p>
                  <p className="text-sm text-muted-foreground">Total spend (fuel + service, all time)</p>
                </div>
              </div>
              {!loadingFleetSummary && fleetSummary && (
                <p className="text-xs text-muted-foreground sm:text-right">
                  Fuel ₹{fleetSummary.totalFuelSpend.toLocaleString()} · Service ₹
                  {fleetSummary.totalServiceSpend.toLocaleString()}
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {loadingFleetSummary
                    ? "…"
                    : fleetSummary?.fleetCostPerKm != null
                      ? `₹${fleetSummary.fleetCostPerKm}`
                      : "—"}
                </p>
                <p className="text-sm text-muted-foreground">Fleet avg cost / km (liquid fills)</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vehicle Cards */}
        <div>
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-xl font-semibold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              Your Vehicles
            </h2>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search name, plate, make…"
                  className="h-9 w-full pl-8 sm:w-[220px]"
                  value={searchParams.get("q") ?? ""}
                  onChange={(e) => {
                    const next = new URLSearchParams(searchParams);
                    const v = e.target.value;
                    if (v) next.set("q", v);
                    else next.delete("q");
                    setSearchParams(next);
                  }}
                />
              </div>
              <Select
                value={typeFilter}
                onValueChange={(value) => {
                  const next = new URLSearchParams(searchParams);
                  if (value === "all") next.delete("type");
                  else next.set("type", value);
                  setSearchParams(next);
                }}
              >
                <SelectTrigger className="h-9 w-full sm:w-[160px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {vehicleTypes.map((vt) => (
                    <SelectItem key={vt.slug} value={vt.slug}>
                      {vt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant={attentionOnly ? "secondary" : "outline"}
                size="sm"
                className="h-9 shrink-0"
                onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  if (attentionOnly) next.delete("attention");
                  else next.set("attention", "1");
                  setSearchParams(next);
                }}
              >
                <AlertTriangle className="mr-1.5 h-4 w-4" />
                Needs attention
              </Button>
            </div>
          </div>
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
              {filteredVehicles.length === 0 ? (
                <Card className="col-span-full border-dashed">
                  <CardContent className="py-8 text-center text-sm text-muted-foreground">
                    No vehicles match your filters.
                  </CardContent>
                </Card>
              ) : (
                filteredVehicles.map((v) => (
                <Link key={v.id} to={`/vehicle/${v.id}`}>
                  <Card className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                            <VehicleTypeIcon type={v.type} className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">{v.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {[v.make, v.model, v.year].filter(Boolean).join(" · ") || v.type}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {v.access && v.access !== "owner" && (
                            <Badge variant="secondary" className="text-xs">
                              Shared
                            </Badge>
                          )}
                          {attentionVehicleIds.has(v.id) && (
                            <Badge variant="outline" className="border-[hsl(38,92%,50%)]/50 text-[hsl(38,92%,50%)]">
                              Attention
                            </Badge>
                          )}
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
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
              ))
              )}
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
