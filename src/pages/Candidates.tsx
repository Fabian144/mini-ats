import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useCandidates, Candidate } from "@/hooks/useCandidates";
import { useJobs } from "@/hooks/useJobs";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
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
import { Plus, Users, Linkedin, Mail, Phone, Trash2, Edit, Briefcase } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { safeExternalUrl } from "@/lib/utils";

type CandidateStatus = Database["public"]["Enums"]["candidate_status"];

const statusLabels: Record<CandidateStatus, string> = {
  new: "Ny",
  screening: "Screening",
  interview: "Intervju",
  offer: "Erbjudande",
  hired: "Anställd",
  rejected: "Avslag",
};

export default function Candidates() {
  const { isAdmin, adminViewAccount, user } = useAuth();
  const { candidates, isLoading, createCandidate, updateCandidate, deleteCandidate } =
    useCandidates();
  const { jobs } = useJobs();
  const [isOpen, setIsOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    linkedin_url: "",
    job_id: "",
    status: "new" as CandidateStatus,
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingCandidate) {
      updateCandidate.mutate({ id: editingCandidate.id, ...formData });
    } else {
      createCandidate.mutate(formData);
    }

    handleClose();
  };

  const openEditDialog = (candidate: Candidate) => {
    setEditingCandidate(candidate);
    setFormData({
      name: candidate.name,
      email: candidate.email || "",
      phone: candidate.phone || "",
      linkedin_url: candidate.linkedin_url || "",
      job_id: candidate.job_id,
      status: candidate.status,
      notes: candidate.notes || "",
    });
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setEditingCandidate(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      linkedin_url: "",
      job_id: "",
      status: "new",
      notes: "",
    });
  };

  const isAllAccountsView = isAdmin && !adminViewAccount;
  const accountLabel = adminViewAccount?.fullName || adminViewAccount?.email || user?.email;
  const isCandidateFormValid = formData.name.trim().length > 0 && formData.job_id.length > 0;

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Kandidater</h1>
            <p className="text-muted-foreground">Alla dina kandidater på ett ställe</p>
          </div>
          <Dialog open={isOpen} onOpenChange={(open) => (open ? setIsOpen(true) : handleClose())}>
            <DialogTrigger asChild>
              <Button disabled={jobs.length === 0 || isAllAccountsView}>
                <Plus className="w-4 h-4 mr-2" />
                Lägg till kandidat
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingCandidate ? "Redigera kandidat" : "Lägg till kandidat"}
                </DialogTitle>
              </DialogHeader>
              {accountLabel && (
                <p className="text-xs text-muted-foreground">
                  {editingCandidate ? "Redigeras för konto" : "Skapas för konto"}
                  <span className="font-medium">{accountLabel}</span>
                </p>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Namn <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="t.ex. Anna Andersson"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="job">
                    Jobb <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.job_id}
                    onValueChange={(value) => setFormData({ ...formData, job_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Välj jobb" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobs.map((job) => (
                        <SelectItem key={job.id} value={job.id}>
                          {job.title} {job.company && `@ ${job.company}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-post</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="anna@email.se"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="070-123 45 67"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn URL</Label>
                  <Input
                    type="url"
                    id="linkedin"
                    value={formData.linkedin_url}
                    onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value as CandidateStatus })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Anteckningar</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Lägg till anteckningar om kandidaten..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Avbryt
                  </Button>
                  <Button type="submit" disabled={!isCandidateFormValid}>
                    {editingCandidate ? "Spara" : "Lägg till"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {jobs.length === 0 && (
          <Card className="mb-6 border-accent/50 bg-accent/5">
            <CardContent className="py-4">
              <p className="text-sm text-muted-foreground">
                Du behöver skapa ett jobb innan du kan lägga till kandidater.
              </p>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Laddar...</div>
        ) : candidates.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg mb-2">Inga kandidater ännu</h3>
              <p className="text-muted-foreground mb-4">Lägg till din första kandidat</p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-wrap gap-2">
            {candidates.map((candidate) => {
              const safeLinkedinUrl = safeExternalUrl(candidate.linkedin_url);

              return (
                <Card key={candidate.id} className="w-full min-w-0 max-w-[35em] flex-[1_1_365px]">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-foreground">{candidate.name}</h3>
                        {candidate.jobs && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <Briefcase className="w-3 h-3" />
                            <span>{candidate.jobs.title}</span>
                          </div>
                        )}
                      </div>
                      <span className={`status-badge status-${candidate.status}`}>
                        {statusLabels[candidate.status]}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">
                          {candidate.email || "Ingen e-post angiven"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{candidate.phone || "Inget telefonnummer angivet"}</span>
                      </div>
                      {safeLinkedinUrl ? (
                        <a
                          href={safeLinkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-primary hover:underline"
                        >
                          <Linkedin className="w-4 h-4" />
                          <span>LinkedIn-profil</span>
                        </a>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Linkedin className="w-4 h-4" />
                          <span>Ingen LinkedIn-profil angiven</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-1 pt-3 border-t border-border">
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(candidate)}>
                        <Edit className="w-4 h-4 mr-1" />
                        Redigera
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Ta bort
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Ta bort kandidat?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Detta tar bort kandidaten permanent. Åtgarden går inte att ångra.
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
                                onClick={() => deleteCandidate.mutate(candidate.id)}
                              >
                                Ta bort
                              </Button>
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
