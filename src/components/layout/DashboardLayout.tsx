import { ReactNode, memo, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Users, Briefcase, LayoutDashboard, LogOut, UserCog } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface DashboardLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Kanban" },
  { href: "/jobs", icon: Briefcase, label: "Jobb" },
  { href: "/candidates", icon: Users, label: "Kandidater" },
];

const DashboardLayout = memo(function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, signOut, isAdmin, adminViewAccount } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const metadataName =
    (user?.user_metadata as { display_name?: string; full_name?: string } | undefined)
      ?.display_name ??
    (user?.user_metadata as { full_name?: string } | undefined)?.full_name ??
    null;
  const [profileName, setProfileName] = useState<string | null>(metadataName);
  const [profileEmail, setProfileEmail] = useState(user?.email ?? "");
  const effectiveUserId = isAdmin && adminViewAccount?.id ? adminViewAccount.id : user?.id;
  const accountLabel = adminViewAccount?.fullName || adminViewAccount?.email || "Alla konton";
  const userName = profileName || metadataName;
  const [isIdentityDialogOpen, setIsIdentityDialogOpen] = useState(false);
  const [identityForm, setIdentityForm] = useState({
    fullName: userName ?? "",
    email: user?.email ?? "",
  });
  const [isSavingIdentity, setIsSavingIdentity] = useState(false);

  useEffect(() => {
    setProfileName(metadataName ?? null);
  }, [metadataName, user?.id]);

  useEffect(() => {
    setProfileEmail(user?.email ?? "");
  }, [user?.email]);

  useEffect(() => {
    if (!isIdentityDialogOpen) return;
    setIdentityForm({
      fullName: userName ?? "",
      email: profileEmail,
    });
  }, [isIdentityDialogOpen, userName, profileEmail]);

  // Refresh session when page visibility changes (e.g., user confirms email in another tab)
  // This ensures email updates are reflected after email confirmation
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        supabase.auth.refreshSession().catch(() => {
          // Silently fail if refresh fails
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Prefetch both candidates and jobs as soon as the layout mounts
  // so navigating between Dashboard/Jobs/Candidates is instant
  useEffect(() => {
    if (!effectiveUserId) return;
    const uid = effectiveUserId;

    queryClient.prefetchQuery({
      queryKey: ["candidates", uid],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("candidates")
          .select(
            "id, user_id, job_id, name, email, phone, linkedin_url, notes, status, created_at, updated_at, jobs(id, title, company)",
          )
          .order("created_at", { ascending: false })
          .limit(200);
        if (error) throw error;
        return data;
      },
      staleTime: 1000 * 60 * 2,
    });

    queryClient.prefetchQuery({
      queryKey: ["jobs", uid],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("jobs")
          .select("id, user_id, title, company, description, location, created_at, updated_at")
          .order("created_at", { ascending: false })
          .limit(200);
        if (error) throw error;
        return data;
      },
      staleTime: 1000 * 60 * 2,
    });
  }, [effectiveUserId, queryClient]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleIdentitySave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user?.id) return;

    const trimmedName = identityForm.fullName.trim();
    const trimmedEmail = identityForm.email.trim();
    const nextName = trimmedName || null;
    const nextEmail = trimmedEmail || null;

    const nameChanged = nextName !== (userName ?? null);
    const emailChanged = nextEmail !== (user?.email ?? null);

    if (!nameChanged && !emailChanged) {
      setIsIdentityDialogOpen(false);
      return;
    }

    try {
      setIsSavingIdentity(true);
      if (emailChanged || nameChanged) {
        const authUpdates: { email?: string; data?: { display_name?: string | null } } = {};

        if (emailChanged && nextEmail) {
          authUpdates.email = nextEmail;
        }

        if (nameChanged) {
          authUpdates.data = { display_name: nextName };
        }

        const { error: authError } = await supabase.auth.updateUser(
          authUpdates,
          emailChanged ? { emailRedirectTo: window.location.origin } : undefined,
        );

        if (authError) throw authError;

        // Refresh session to sync updated user data (display_name updates immediately,
        // email will show new value once confirmed via email link)
        await supabase.auth.refreshSession();
      }

      if (nameChanged) {
        setProfileName(nextName);
      }

      // Note: Email will update automatically via the useEffect watching user?.email
      // once the user confirms the email change via the confirmation links.
      // We don't update it here because it hasn't been confirmed in the backend yet.

      toast({
        title: "Uppdaterat!",
        description: emailChanged
          ? "E-postbytet kräver bekräftelse via både den gamla och nya adressen."
          : "Dina profiluppgifter har uppdaterats.",
      });
      setIsIdentityDialogOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Kunde inte uppdatera profilen";
      toast({
        title: "Något gick fel",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSavingIdentity(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-sidebar text-sidebar-foreground flex flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
              <Users className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg">TalentTrack</h1>
              <p className="text-xs text-sidebar-foreground/60">Mini ATS</p>
            </div>
          </div>
          {isAdmin && (
            <div className="mt-3 rounded-md border border-sidebar-accent/40 bg-sidebar-accent/20 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-sidebar-foreground/60">
                Visar konto
              </p>
              <p className="text-sm font-medium text-sidebar-foreground truncate">{accountLabel}</p>
            </div>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}

          {isAdmin && (
            <Link
              to="/admin"
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                location.pathname === "/admin"
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
            >
              <UserCog className="w-5 h-5" />
              <span className="font-medium">Admin</span>
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <button
            type="button"
            className="flex w-full items-center gap-3 px-4 py-2 mb-2 rounded-md text-left transition-colors hover:bg-sidebar-accent/50"
            onClick={() => setIsIdentityDialogOpen(true)}
          >
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center">
              <span className="text-sm font-medium">{user?.email?.charAt(0)?.toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{userName}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">{profileEmail}</p>
              <p className="text-xs text-sidebar-foreground/60">{isAdmin ? "Admin" : "Kund"}</p>
            </div>
          </button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logga ut
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Logga ut från kontot?</AlertDialogTitle>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel asChild>
                  <Button type="button" variant="outline">
                    Avbryt
                  </Button>
                </AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button type="button" onClick={handleSignOut}>
                    Logga ut
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </aside>

      <Dialog open={isIdentityDialogOpen} onOpenChange={setIsIdentityDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Uppdatera profil</DialogTitle>
            <DialogDescription>
              Om du byter e-post måste du bekräfta bytet via både den gamla och nya adressen.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleIdentitySave}>
            <div className="space-y-2">
              <Label htmlFor="profile-full-name">Användarnamn</Label>
              <Input
                id="profile-full-name"
                value={identityForm.fullName}
                onChange={(event) =>
                  setIdentityForm((current) => ({
                    ...current,
                    fullName: event.target.value,
                  }))
                }
                placeholder="Ditt namn"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-email">E-post</Label>
              <Input
                id="profile-email"
                type="email"
                value={identityForm.email}
                onChange={(event) =>
                  setIdentityForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                placeholder="namn@foretag.se"
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsIdentityDialogOpen(false)}
              >
                Avbryt
              </Button>
              <Button type="submit" disabled={isSavingIdentity}>
                {isSavingIdentity ? "Sparar..." : "Spara"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
});

export default DashboardLayout;
