import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function Recovery() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const { updatePassword, user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Laddar...</div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">TalentTrack</h1>
            <p className="text-muted-foreground mt-2">Ditt smarta rekryteringsverktyg</p>
          </div>

          <Card className="glass-card">
            <CardHeader className="text-center pb-4">
              <CardTitle>Redan inloggad</CardTitle>
              <CardDescription>
                Du måste vara utloggad för att kunna återställa lösenordet.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full"
                onClick={async () => {
                  await signOut();
                  navigate("/auth", { replace: true });
                }}
              >
                Logga ut och försök igen
              </Button>
              <Button className="w-full" onClick={() => navigate("/dashboard")}>
                Tillbaka till startsidan
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const clearRecoveryUrl = () => {
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);

    url.hash = "";
    if (params.get("type") === "recovery") {
      params.delete("type");
      url.search = params.toString() ? `?${params.toString()}` : "";
    }

    window.history.replaceState({}, "", url.toString());
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast({
        title: "Lösenordet är för kort",
        description: "Välj ett lösenord med minst 6 tecken.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Lösenorden matchar inte",
        description: "Kontrollera att båda fälten har samma lösenord.",
        variant: "destructive",
      });
      return;
    }

    setUpdatingPassword(true);
    const { error } = await updatePassword(newPassword);

    if (error) {
      toast({
        title: "Kunde inte uppdatera lösenord",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Lösenord uppdaterat",
        description: "Du kan nu logga in med ditt nya lösenord.",
      });
      clearRecoveryUrl();
      navigate("/auth");
    }

    setUpdatingPassword(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">TalentTrack</h1>
          <p className="text-muted-foreground mt-2">Ditt smarta rekryteringsverktyg</p>
        </div>

        <Card className="glass-card">
          <CardHeader className="text-center pb-2">
            <CardTitle>Återställ lösenord</CardTitle>
            <CardDescription>Välj ett nytt lösenord för ditt konto.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">
                  Nytt lösenord <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Minst 6 tecken"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">
                  Bekräfta lösenord <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Upprepa lösenordet"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={updatingPassword}>
                {updatingPassword ? "Uppdaterar..." : "Uppdatera lösenord"}
              </Button>
              <Button
                type="button"
                variant="link"
                className="px-0"
                onClick={() => navigate("/auth")}
              >
                Tillbaka till inloggning
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
