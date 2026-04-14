import { useState } from "react";
import { apiDownload, downloadBlob } from "@/lib/api";
import type { FleetFuelAnalytics, FleetSummary } from "@/types/domain";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, Loader2, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Props = {
  fleetSummary: FleetSummary | undefined;
  fleetFuel: FleetFuelAnalytics | undefined;
};

function printFleetReport(summary: FleetSummary, fuel: FleetFuelAnalytics | undefined) {
  const w = window.open("", "_blank");
  if (!w) return;
  const rows = summary.tcoByMonth
    .slice(-12)
    .map((r) => `<tr><td>${r.month}</td><td>₹${r.fuelCost.toLocaleString()}</td><td>₹${r.serviceCost.toLocaleString()}</td><td>₹${r.total.toLocaleString()}</td></tr>`)
    .join("");
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>VehicleHub fleet report</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 24px; color: #0f172a; }
    h1 { font-size: 1.25rem; }
    table { border-collapse: collapse; width: 100%; margin-top: 16px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
    th { background: #f1f5f9; }
    .meta { color: #64748b; font-size: 0.875rem; margin-top: 8px; }
  </style></head><body>
  <h1>VehicleHub — Fleet summary</h1>
  <p class="meta">Generated ${new Date().toLocaleString()}</p>
  <p>Total spend (fuel + service): <strong>₹${summary.totalCostOfOwnership.toLocaleString()}</strong></p>
  <p>Fleet cost / km (liquid): ${summary.fleetCostPerKm != null ? `₹${summary.fleetCostPerKm}` : "—"}</p>
  ${fuel ? `<p>This month energy spend: ₹${fuel.thisMonthFuelCost.toLocaleString()} · Avg km/L: ${fuel.avgKmPerL ?? "—"}</p>` : ""}
  <h2 style="font-size:1rem;margin-top:24px">TCO by month (last 12 rows)</h2>
  <table><thead><tr><th>Month</th><th>Fuel</th><th>Service</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table>
  <script>setTimeout(() => window.print(), 300);</script>
  </body></html>`);
  w.document.close();
}

export function ExportMenu({ fleetSummary, fleetFuel }: Props) {
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (key: string, path: string, filename: string) => {
    setBusy(key);
    try {
      const blob = await apiDownload(path);
      downloadBlob(blob, filename);
    } catch (e: unknown) {
      toast({
        title: "Export failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Download CSV</DropdownMenuLabel>
        <DropdownMenuItem
          disabled={!!busy}
          onSelect={() => run("v", "/api/v1/exports/vehicles.csv", "vehicles.csv")}
        >
          Vehicles
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!!busy}
          onSelect={() => run("f", "/api/v1/exports/fuel-logs.csv", "fuel-logs.csv")}
        >
          Fuel logs
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!!busy}
          onSelect={() => run("s", "/api/v1/exports/service-records.csv", "service-records.csv")}
        >
          Service records
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!!busy}
          onSelect={() => run("d", "/api/v1/exports/documents.csv", "documents.csv")}
        >
          Documents
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={!fleetSummary}
          onSelect={() => {
            if (fleetSummary) printFleetReport(fleetSummary, fleetFuel);
          }}
        >
          <Printer className="mr-2 h-4 w-4" />
          Print report (PDF via browser)
        </DropdownMenuItem>
        <DropdownMenuItem disabled className="text-xs text-muted-foreground">
          <FileText className="mr-2 h-3.5 w-3.5" />
          Save the print dialog as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
