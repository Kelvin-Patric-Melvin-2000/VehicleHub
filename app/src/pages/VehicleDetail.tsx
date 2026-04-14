import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { useVehicle, useDeleteVehicle } from "@/hooks/useVehicles";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Fuel, Wrench, FileText, BarChart3, Trash2, ArrowLeft } from "lucide-react";
import { VehicleTypeIcon } from "@/components/vehicle/VehicleTypeIcon";
import { FuelLogTab } from "@/components/vehicle/FuelLogTab";
import { ServiceTab } from "@/components/vehicle/ServiceTab";
import { DocumentsTab } from "@/components/vehicle/DocumentsTab";
import { AnalyticsTab } from "@/components/vehicle/AnalyticsTab";
import { VehicleSharePanel } from "@/components/vehicle/VehicleSharePanel";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function VehicleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: vehicle, isLoading } = useVehicle(id!);
  const deleteVehicle = useDeleteVehicle();
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      await deleteVehicle.mutateAsync(id!);
      toast({ title: "Vehicle deleted" });
      navigate("/");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </AppLayout>
    );
  }

  if (!vehicle) {
    return (
      <AppLayout>
        <p className="text-muted-foreground">Vehicle not found.</p>
      </AppLayout>
    );
  }

  const isOwner = !vehicle.access || vehicle.access === "owner";
  const readOnly = vehicle.access === "view";

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Back + Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                <VehicleTypeIcon type={vehicle.type} className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold" style={{ fontFamily: 'Rajdhani, sans-serif' }}>{vehicle.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {[vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(" · ")}
                  {vehicle.registration_number && (
                    <Badge variant="outline" className="ml-2 text-xs">{vehicle.registration_number}</Badge>
                  )}
                  {vehicle.access && vehicle.access !== "owner" && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Shared ({vehicle.access})
                    </Badge>
                  )}
                </p>
              </div>
            </div>
          </div>
          {isOwner && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {vehicle.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this vehicle and all its data (fuel logs, service records, documents).
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Mileage */}
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <Fuel className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Current Mileage</p>
              <p className="text-xl font-bold">{Number(vehicle.current_mileage).toLocaleString()} km</p>
            </div>
          </CardContent>
        </Card>

        {isOwner && <VehicleSharePanel vehicleId={id!} />}

        {/* Tabs */}
        <Tabs defaultValue="analytics" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="analytics" className="gap-1.5 text-xs sm:text-sm">
              <BarChart3 className="h-3.5 w-3.5" /> Analytics
            </TabsTrigger>
            <TabsTrigger value="fuel" className="gap-1.5 text-xs sm:text-sm">
              <Fuel className="h-3.5 w-3.5" /> Fuel
            </TabsTrigger>
            <TabsTrigger value="service" className="gap-1.5 text-xs sm:text-sm">
              <Wrench className="h-3.5 w-3.5" /> Service
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-1.5 text-xs sm:text-sm">
              <FileText className="h-3.5 w-3.5" /> Docs
            </TabsTrigger>
          </TabsList>
          <TabsContent value="analytics"><AnalyticsTab vehicleId={id!} /></TabsContent>
          <TabsContent value="fuel">
            <FuelLogTab vehicleId={id!} vehicleType={vehicle.type} readOnly={readOnly} />
          </TabsContent>
          <TabsContent value="service">
            <ServiceTab
              vehicleId={id!}
              vehicleType={vehicle.type}
              currentMileage={vehicle.current_mileage}
              readOnly={readOnly}
            />
          </TabsContent>
          <TabsContent value="documents">
            <DocumentsTab vehicleId={id!} readOnly={readOnly} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
