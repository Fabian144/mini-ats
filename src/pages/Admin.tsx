import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { userCreationClient } from "@/integrations/supabase/userCreationClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users, Shield, User, Trash2, ArrowRight } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  role: AppRole;
}

export default function Admin() {
  const { toast } = useToast();
  const { user: currentUser, isAdmin, signOut, adminViewAccount, setAdminViewAccount } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    fullName: "",
    role: "customer" as AppRole,
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      // Single query: fetch profiles with their roles via a parallel Promise.all
      const [profilesRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("user_id, email, full_name"),
        supabase.from("user_roles").select("user_id, role"),
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (rolesRes.error) throw rolesRes.error;

      // Build a lookup map for O(1) role resolution instead of O(n) .find()
      const roleMap = new Map<string, AppRole>();
      for (const r of rolesRes.data) {
        roleMap.set(r.user_id, r.role);
      }

      return profilesRes.data.map((profile) => ({
        id: profile.user_id,
        email: profile.email,
        full_name: profile.full_name,
        role: roleMap.get(profile.user_id) ?? "customer",
      })) as UserWithRole[];
    },
    staleTime: 1000 * 60 * 2,
  });

  const createUser = useMutation({
    mutationFn: async ({ email, password, fullName, role }: typeof newUser) => {
      // Create user via auth with initial role in metadata
      const { data: authData, error: authError } = await userCreationClient.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Användare skapades inte");

      return authData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Användare skapad!" });
      setIsOpen(false);
      setNewUser({ email: "", password: "", fullName: "", role: "customer" });
    },
    onError: (error: Error) => {
      toast({
        title: "Kunde inte skapa användare",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const isSelf = currentUser?.id === userId;
      const { error } = isSelf
        ? await supabase.rpc("delete_own_account")
        : await supabase.rpc("delete_user", { _user_id: userId });
      if (error) throw error;
      if (isSelf) {
        await signOut();
      }
    },
    onMutate: (userId) => {
      setDeletingUserId(userId);
    },
    onSuccess: (_data, userId) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      if (adminViewAccount?.id === userId && currentUser?.id !== userId) {
        setAdminViewAccount(null);
      }
      toast({ title: "Konto borttaget." });
    },
    onError: (error: Error) => {
      toast({
        title: "Kunde inte ta bort konto",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setDeletingUserId(null);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUser.mutate(newUser);
  };

  const sortedUsers = [...users].sort((a, b) => {
    const currentId = currentUser?.id;
    const aIsSelf = a.id === currentId;
    const bIsSelf = b.id === currentId;
    if (aIsSelf !== bIsSelf) return aIsSelf ? -1 : 1;

    const aIsAdmin = a.role === "admin";
    const bIsAdmin = b.role === "admin";
    if (aIsAdmin !== bIsAdmin) return aIsAdmin ? -1 : 1;

    return a.email.localeCompare(b.email);
  });

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Administration</h1>
            <p className="text-muted-foreground">Hantera användare och behörigheter</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Skapa användare
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Skapa ny användare</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Fullständigt namn</Label>
                  <Input
                    id="fullName"
                    value={newUser.fullName}
                    onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                    placeholder="Anna Andersson"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-post</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="anna@email.se"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Lösenord</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Minst 6 tecken"
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Roll</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value) => setNewUser({ ...newUser, role: value as AppRole })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Kund</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                    Avbryt
                  </Button>
                  <Button type="submit" disabled={createUser.isPending}>
                    {createUser.isPending ? "Skapar..." : "Skapa användare"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Laddar...</div>
        ) : users.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg mb-2">Inga användare ännu</h3>
              <p className="text-muted-foreground">Skapa den första användaren</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedUsers.map((user) => (
              <Card key={user.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {user.role === "admin" ? (
                          <Shield className="w-5 h-5 text-primary" />
                        ) : (
                          <User className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-base truncate">
                          {user.full_name || "Namnlös"}
                          {user.id === currentUser?.id ? " (Du)" : ""}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                    {isAdmin ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            className="whitespace-nowrap"
                            disabled={deleteUser.isPending && deletingUserId === user.id}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {deleteUser.isPending && deletingUserId === user.id
                              ? "Tar bort..."
                              : "Ta bort konto"}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Ta bort konto?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Detta tar bort kontot och all tillhörande data. Åtgärden går inte att
                              ångra.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel asChild>
                              <Button type="button" variant="outline">
                                Avbryt
                              </Button>
                            </AlertDialogCancel>
                            <AlertDialogAction asChild>
                              <Button
                                type="button"
                                variant="destructive"
                                onClick={() => deleteUser.mutate(user.id)}
                              >
                                Ta bort
                              </Button>
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Badge
                      variant={user.role === "admin" ? "default" : "secondary"}
                      className="pointer-events-none"
                    >
                      {user.role === "admin" ? "Admin" : "Kund"}
                    </Badge>
                    {user.role === "admin" && isAdmin && (
                      <Button
                        type="button"
                        variant={
                          user.id === currentUser?.id && !adminViewAccount ? "default" : "outline"
                        }
                        size="sm"
                        className="w-full justify-between"
                        disabled={user.id !== currentUser?.id}
                        onClick={() => {
                          if (user.id !== currentUser?.id) return;
                          setAdminViewAccount(null);
                        }}
                      >
                        {user.id === currentUser?.id && !adminViewAccount
                          ? "Visar alla konton"
                          : "Visa alla konton"}
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    )}
                    {user.role === "customer" && isAdmin && (
                      <Button
                        type="button"
                        variant={adminViewAccount?.id === user.id ? "default" : "outline"}
                        size="sm"
                        className="w-full justify-between"
                        onClick={() => {
                          setAdminViewAccount({
                            id: user.id,
                            email: user.email,
                            fullName: user.full_name,
                          });
                        }}
                      >
                        {adminViewAccount?.id === user.id ? "Visar detta konto" : "Visa konto"}
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
