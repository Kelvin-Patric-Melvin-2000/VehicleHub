import { useFuelLogs } from "@/hooks/useFuelLogs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { format, parseISO } from "date-fns";

export function AnalyticsTab({ vehicleId }: { vehicleId: string }) {
  const { data: logs, isLoading } = useFuelLogs(vehicleId);

  if (isLoading) return <Card><CardContent className="h-64 animate-pulse p-4" /></Card>;

  const sortedLogs = [...(logs || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculate economy for each fill-up
  const economyData = sortedLogs.map((log, i) => {
    if (i === 0) return null;
    const prev = sortedLogs[i - 1];
    const dist = log.odometer_reading - prev.odometer_reading;
    if (dist <= 0) return null;
    return {
      date: format(parseISO(log.date), "MMM dd"),
      kmPerL: parseFloat((dist / log.fuel_quantity_liters).toFixed(1)),
      costPerKm: parseFloat((log.cost / dist).toFixed(2)),
    };
  }).filter(Boolean);

  // Monthly cost aggregation
  const monthlyMap = new Map<string, number>();
  sortedLogs.forEach((log) => {
    const month = format(parseISO(log.date), "MMM yyyy");
    monthlyMap.set(month, (monthlyMap.get(month) || 0) + log.cost);
  });
  const monthlyData = Array.from(monthlyMap.entries()).map(([month, cost]) => ({ month, cost: parseFloat(cost.toFixed(0)) }));

  // Summary stats
  const totalFuel = sortedLogs.reduce((s, l) => s + l.fuel_quantity_liters, 0);
  const totalCost = sortedLogs.reduce((s, l) => s + l.cost, 0);
  const avgEconomy = economyData.length > 0
    ? (economyData.reduce((s, d: any) => s + d.kmPerL, 0) / economyData.length).toFixed(1)
    : "—";
  const avgCostPerKm = economyData.length > 0
    ? (economyData.reduce((s, d: any) => s + d.costPerKm, 0) / economyData.length).toFixed(2)
    : "—";

  if (sortedLogs.length < 2) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-12">
          <BarChart3 className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-muted-foreground">Need at least 2 fuel entries for analytics</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Avg Economy", value: `${avgEconomy} km/L` },
          { label: "Avg Cost/km", value: `₹${avgCostPerKm}` },
          { label: "Total Fuel", value: `${totalFuel.toFixed(1)} L` },
          { label: "Total Spend", value: `₹${totalCost.toLocaleString()}` },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <p className="text-xl font-bold text-primary">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Economy Trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Fuel Economy Trend (km/L)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={economyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
                <XAxis dataKey="date" stroke="hsl(215, 20%, 55%)" fontSize={12} />
                <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: "hsl(222, 47%, 9%)", border: "1px solid hsl(222, 30%, 18%)", borderRadius: "8px", color: "hsl(210, 40%, 96%)" }}
                />
                <Line type="monotone" dataKey="kmPerL" stroke="hsl(217, 91%, 60%)" strokeWidth={2} dot={{ r: 4, fill: "hsl(217, 91%, 60%)" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Cost */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Monthly Fuel Cost (₹)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
                <XAxis dataKey="month" stroke="hsl(215, 20%, 55%)" fontSize={12} />
                <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: "hsl(222, 47%, 9%)", border: "1px solid hsl(222, 30%, 18%)", borderRadius: "8px", color: "hsl(210, 40%, 96%)" }}
                />
                <Bar dataKey="cost" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
