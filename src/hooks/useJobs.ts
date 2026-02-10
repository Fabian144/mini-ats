import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Job {
  id: string;
  user_id: string;
  title: string;
  company: string | null;
  description: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
}

export function useJobs() {
  const { user, isAdmin, adminViewAccount } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const targetUserId = adminViewAccount?.id ?? user?.id;
  const isAllAccountsView = isAdmin && !adminViewAccount;

  const jobsQuery = useQuery({
    queryKey: ["jobs", isAllAccountsView ? "all" : targetUserId],
    queryFn: async () => {
      let query = supabase
        .from("jobs")
        .select("id, user_id, title, company, description, location, created_at, updated_at")
        .order("created_at", { ascending: true })
        .limit(200);

      if (!isAllAccountsView) {
        query = query.eq("user_id", targetUserId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Job[];
    },
    enabled: isAllAccountsView ? isAdmin : !!targetUserId,
    staleTime: 1000 * 60 * 2,
    refetchOnMount: "always",
  });

  const createJob = useMutation({
    mutationFn: async (job: Omit<Job, "id" | "user_id" | "created_at" | "updated_at">) => {
      if (!targetUserId) throw new Error("Missing target account for job creation");
      const { data, error } = await supabase
        .from("jobs")
        .insert({ ...job, user_id: targetUserId! })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast({ title: "Jobb skapat!" });
    },
    onError: (error: Error) => {
      toast({ title: "Kunde inte skapa jobb", description: error.message, variant: "destructive" });
    },
  });

  const updateJob = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Job> & { id: string }) => {
      const { data, error } = await supabase
        .from("jobs")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast({ title: "Jobb uppdaterat!" });
    },
    onError: (error: Error) => {
      toast({
        title: "Kunde inte uppdatera jobb",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteJob = useMutation({
    mutationFn: async (id: string) => {
      const { error: candidatesError } = await supabase
        .from("candidates")
        .delete()
        .eq("job_id", id);
      if (candidatesError) throw candidatesError;

      const { error } = await supabase.from("jobs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      toast({ title: "Jobb borttaget!" });
    },
    onError: (error: Error) => {
      toast({
        title: "Kunde inte ta bort jobb",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    jobs:
      !isAllAccountsView && targetUserId
        ? (jobsQuery.data ?? []).filter((job) => job.user_id === targetUserId)
        : jobsQuery.data ?? [],
    isLoading: jobsQuery.isLoading,
    createJob,
    updateJob,
    deleteJob,
  };
}
