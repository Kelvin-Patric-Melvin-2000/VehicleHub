import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNotificationSettings, useUpdateNotificationSettings } from "@/hooks/useNotificationSettings";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function Settings() {
  const { data, isLoading } = useNotificationSettings();
  const update = useUpdateNotificationSettings();
  const { toast } = useToast();
  const [emailOn, setEmailOn] = useState(true);
  const [leadSvc, setLeadSvc] = useState("7");
  const [leadDoc, setLeadDoc] = useState("14");

  useEffect(() => {
    if (data) {
      setEmailOn(data.notification_email_enabled);
      setLeadSvc(String(data.reminder_lead_days_service));
      setLeadDoc(String(data.reminder_lead_days_documents));
    }
  }, [data]);

  const handleSave = async () => {
    try {
      await update.mutateAsync({
        notification_email_enabled: emailOn,
        reminder_lead_days_service: parseInt(leadSvc, 10) || 0,
        reminder_lead_days_documents: parseInt(leadDoc, 10) || 0,
      });
      toast({ title: "Settings saved" });
    } catch (e: unknown) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to save",
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-lg space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "Rajdhani, sans-serif" }}>
            Settings
          </h1>
          <p className="text-muted-foreground">Notifications and reminders</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Email reminders</CardTitle>
            <CardDescription>
              Configure outbound email for upcoming services and expiring documents. Requires{" "}
              <code className="text-xs">RESEND_API_KEY</code> on the server.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="email-on">Send reminder emails</Label>
                  <Switch id="email-on" checked={emailOn} onCheckedChange={setEmailOn} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Service lead window (days)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={90}
                      value={leadSvc}
                      onChange={(e) => setLeadSvc(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Document lead window (days)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={90}
                      value={leadDoc}
                      onChange={(e) => setLeadDoc(e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={handleSave} disabled={update.isPending}>
                  {update.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
