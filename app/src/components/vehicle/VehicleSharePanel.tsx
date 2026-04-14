import { useState } from "react";
import { useVehicleShares, useCreateVehicleShare, useDeleteVehicleShare } from "@/hooks/useVehicleShares";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function VehicleSharePanel({ vehicleId }: { vehicleId: string }) {
  const { data: shares, isLoading } = useVehicleShares(vehicleId, true);
  const createShare = useCreateVehicleShare();
  const deleteShare = useDeleteVehicleShare();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"view" | "edit">("view");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      await createShare.mutateAsync({ vehicleId, email: email.trim(), role });
      setEmail("");
      toast({ title: "Access shared" });
    } catch (err: unknown) {
      toast({
        title: "Could not share",
        description: err instanceof Error ? err.message : "Error",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sharing</CardTitle>
        <CardDescription>
          Invite another account by email. <strong>View</strong> can browse data; <strong>Edit</strong> can add fuel,
          services, and documents.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleAdd} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="grid flex-1 gap-2 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>User email</Label>
              <Input
                type="email"
                placeholder="friend@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as "view" | "edit")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View</SelectItem>
                  <SelectItem value="edit">Edit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit" className="gap-2" disabled={createShare.isPending}>
            <UserPlus className="h-4 w-4" />
            Share
          </Button>
        </form>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : shares && shares.length > 0 ? (
          <ul className="space-y-2">
            {shares.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
              >
                <span>
                  {s.user?.email ?? "Unknown"} · {s.role}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => deleteShare.mutate({ vehicleId, shareId: s.id })}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Not shared with anyone yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
