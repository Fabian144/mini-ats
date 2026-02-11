import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export default function EmailConfirmed() {
  useEffect(() => {
    // Auto-redirect to dashboard after 10 seconds
    const timer = setTimeout(() => {
      window.location.href = "/mini-ats/dashboard";
    }, 10000);

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
          Din e-postadress har bekräftats, se till att bekräfta den på båda mejladresserna. Du
          omdirigeras till startsidan inom några sekunder...
        </p>
        <Link to="/dashboard">
          <Button className="w-full">Gå till startsidan nu</Button>
        </Link>
      </div>
    </div>
  );
}
