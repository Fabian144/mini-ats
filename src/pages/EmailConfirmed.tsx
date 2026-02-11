import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export default function EmailConfirmed() {
  const navigate = useNavigate();
  const historyCount = Number.parseInt(sessionStorage.getItem("route_history_count") ?? "1", 10);
  const url = new URL(window.location.href);
  const searchParams = url.searchParams;
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
  const hasErrorParam =
    searchParams.has("error") ||
    searchParams.has("error_code") ||
    searchParams.has("error_description") ||
    hashParams.has("error") ||
    hashParams.has("error_code") ||
    hashParams.has("error_description");

  if (Number.isNaN(historyCount) || historyCount > 1 || hasErrorParam) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-in">
          <Card className="glass-card">
            <CardHeader className="text-center pb-2">
              <CardTitle>Ogiltig bekräftelselänk</CardTitle>
              <CardDescription>Länken verkar vara för gammal eller redan använd.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => navigate("/auth")}>
                Tillbaka till startsidan
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  useEffect(() => {
    // Auto-redirect to dashboard after 5 seconds
    const timer = setTimeout(() => {
      window.location.href = "/mini-ats/dashboard";
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <CheckCircle className="w-16 h-16 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold mb-2">E-post bekräftad!</h1>
        <p className="text-muted-foreground mb-8">
          Din e-postadress har bekräftats. Du omdirigeras till startsidan inom några sekunder...
        </p>
        <Link to="/dashboard">
          <Button className="w-full">Gå till startsidan nu</Button>
        </Link>
      </div>
    </div>
  );
}
