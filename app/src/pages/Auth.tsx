import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Bike } from "lucide-react";

export default function Auth() {
  const { user, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>, mode: "login" | "signup") => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    const password = form.get("password") as string;
    const displayName = form.get("displayName") as string;

    const { error } = mode === "login"
      ? await signIn(email, password)
      : await signUp(email, password, displayName);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else if (mode === "signup") {
      toast({ title: "Account created!", description: "You are signed in." });
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
            <Bike className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Vehicle Health Tracker</CardTitle>
          <CardDescription>Track your vehicle's health, fuel & documents</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={(e) => handleSubmit(e, "login")} className="space-y-4 pt-4">
                <Input name="email" type="email" placeholder="Email" required />
                <Input name="password" type="password" placeholder="Password" required minLength={6} />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={(e) => handleSubmit(e, "signup")} className="space-y-4 pt-4">
                <Input name="displayName" placeholder="Display Name" required />
                <Input name="email" type="email" placeholder="Email" required />
                <Input name="password" type="password" placeholder="Password (min 6 chars)" required minLength={6} />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
