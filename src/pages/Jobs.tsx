import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useJobs, Job } from "@/hooks/useJobs";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Briefcase, MapPin, Building2, Trash2, Edit } from "lucide-react";

export default function Jobs() {
  const { isAdmin, adminViewAccount, user } = useAuth();
  const { jobs, isLoading, createJob, updateJob, deleteJob } = useJobs();
  const [isOpen, setIsOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    description: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingJob) {
      updateJob.mutate({ id: editingJob.id, ...formData });
    } else {
      createJob.mutate(formData);
    }

    setIsOpen(false);
    setEditingJob(null);
    setFormData({ title: "", company: "", location: "", description: "" });
  };

  const openEditDialog = (job: Job) => {
    setEditingJob(job);
    setFormData({
      title: job.title,
      company: job.company || "",
      location: job.location || "",
      description: job.description || "",
    });
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setEditingJob(null);
    setFormData({ title: "", company: "", location: "", description: "" });
  };

  const isAllAccountsView = isAdmin && !adminViewAccount;
  const accountLabel = adminViewAccount?.fullName || adminViewAccount?.email || user?.email;

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Jobb</h1>
            <p className="text-muted-foreground">Hantera dina rekryteringsuppdrag</p>
          </div>
          <Dialog open={isOpen} onOpenChange={(open) => (open ? setIsOpen(true) : handleClose())}>
            <DialogTrigger asChild>
              <Button disabled={isAllAccountsView}>
                <Plus className="w-4 h-4 mr-2" />
                Lägg till jobb
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingJob ? "Redigera jobb" : "Lägg till jobb"}</DialogTitle>
              </DialogHeader>
              {accountLabel && (
                <p className="text-xs text-muted-foreground">
                  {editingJob ? "Redigeras för konto" : "Skapas för konto"}
                  <span className="font-medium">{accountLabel}</span>
                </p>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Jobbtitel *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="t.ex. Frontend-utvecklare"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Företag</Label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="t.ex. TechAB"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Plats</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="t.ex. Stockholm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Beskrivning</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Beskriv rollen..."
                    rows={4}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Avbryt
                  </Button>
                  <Button type="submit">{editingJob ? "Spara" : "Skapa"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Laddar...</div>
        ) : jobs.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg mb-2">Inga jobb ännu</h3>
              <p className="text-muted-foreground mb-4">
                Lägg till ditt första rekryteringsuppdrag
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <Card key={job.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{job.title}</CardTitle>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(job)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Ta bort jobb?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Detta tar bort jobbet och alla kopplade kandidater. Åtgarden går inte
                              att ångra.
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
                                onClick={() => deleteJob.mutate(job.id)}
                              >
                                Ta bort
                              </Button>
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {job.company && (
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        <span>{job.company}</span>
                      </div>
                    )}
                    {job.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{job.location}</span>
                      </div>
                    )}
                    {job.description && (
                      <p className="line-clamp-2 pt-2 border-t border-border mt-3">
                        {job.description}
                      </p>
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
