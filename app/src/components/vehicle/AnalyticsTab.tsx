import { useVehicleFuelAnalytics } from "@/hooks/useVehicleFuelAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { format, parseISO } from "date-fns";

export function AnalyticsTab({ vehicleId }: { vehicleId: string }) {
  const { data: a, isLoading } = useVehicleFuelAnalytics(vehicleId);

  if (isLoading) return <Card><CardContent className="h-64 animate-pulse p-4" /></Card>;

  if (!a || a.fillCount === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-12">
          <BarChart3 className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-muted-foreground">Add fuel or charging logs to see analytics</p>
        </CardContent>
      </Card>
    );
  }

  const liquid = a.analyticsMode === "liquid";
  const unitShort = liquid ? "L" : "kWh";
  const economyLabel = liquid ? "km/L" : "km/kWh";
  const priceLabel = liquid ? "₹/L" : "₹/kWh";

  const priceChartData = a.priceTrend.map((p) => ({
    label: format(parseISO(p.date), "MMM dd"),
    pricePerUnit: p.pricePerUnit,
  }));

  const economyChartData = a.economyTrend.map((p) => ({
    label: format(parseISO(p.date), "MMM dd"),
    economy: p.economy,
  }));

  const qtyLabel = liquid ? "Total fuel" : "Total energy";

  const statCards = [
    { label: liquid ? "Avg economy" : "Avg efficiency", value: a.avgEconomy != null ? `${a.avgEconomy} ${economyLabel}` : "—" },
    { label: `Avg price (${priceLabel})`, value: a.avgPricePerUnit != null ? `₹${a.avgPricePerUnit}` : "—" },
    { label: "Avg cost/km", value: a.avgCostPerKm != null ? `₹${a.avgCostPerKm}` : "—" },
    { label: qtyLabel, value: `${a.totalQuantity.toFixed(1)} ${unitShort}` },
    { label: "Total spend", value: `₹${a.totalCost.toLocaleString()}` },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <p className="text-xl font-bold text-primary">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {priceChartData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Price trend ({priceLabel})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
                  <XAxis dataKey="label" stroke="hsl(215, 20%, 55%)" fontSize={12} />
                  <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: "hsl(222, 47%, 9%)", border: "1px solid hsl(222, 30%, 18%)", borderRadius: "8px", color: "hsl(210, 40%, 96%)" }}
                  />
                  <Line type="monotone" dataKey="pricePerUnit" stroke="hsl(217, 91%, 60%)" strokeWidth={2} dot={{ r: 4, fill: "hsl(217, 91%, 60%)" }} name={priceLabel} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {economyChartData.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Economy trend ({economyLabel})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={economyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
                  <XAxis dataKey="label" stroke="hsl(215, 20%, 55%)" fontSize={12} />
                  <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: "hsl(222, 47%, 9%)", border: "1px solid hsl(222, 30%, 18%)", borderRadius: "8px", color: "hsl(210, 40%, 96%)" }}
                  />
                  <Line type="monotone" dataKey="economy" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={{ r: 4, fill: "hsl(142, 71%, 45%)" }} name={economyLabel} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Add at least two entries to compute {economyLabel} between fill-ups.
          </CardContent>
        </Card>
      )}

      {a.monthlyAvgPrice.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average price by month ({priceLabel})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={a.monthlyAvgPrice}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
                  <XAxis dataKey="month" stroke="hsl(215, 20%, 55%)" fontSize={12} />
                  <YAxis stroke="hsl(215, 20%, 55%)" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: "hsl(222, 47%, 9%)", border: "1px solid hsl(222, 30%, 18%)", borderRadius: "8px", color: "hsl(210, 40%, 96%)" }}
                  />
                  <Bar dataKey="avgPricePerUnit" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} name={`Avg ${priceLabel}`} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Monthly cost (₹)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={a.monthly}>
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
