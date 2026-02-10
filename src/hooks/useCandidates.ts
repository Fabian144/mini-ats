import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type CandidateStatus = Database["public"]["Enums"]["candidate_status"];

export interface Candidate {
  id: string;
  user_id: string;
  job_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  notes: string | null;
  status: CandidateStatus;
  created_at: string;
  updated_at: string;
  jobs?: {
    id: string;
    title: string;
    company: string | null;
  };
}

export function useCandidates() {
  const { user, isAdmin, adminViewAccount } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const targetUserId = adminViewAccount?.id ?? user?.id;
  const isAllAccountsView = isAdmin && !adminViewAccount;

  const candidatesQuery = useQuery({
    queryKey: ["candidates", isAllAccountsView ? "all" : targetUserId],
    queryFn: async () => {
      let query = supabase
        .from("candidates")
        .select(
          `
          id,
          user_id,
          job_id,
          name,
          email,
          phone,
          linkedin_url,
          notes,
          status,
          created_at,
          updated_at,
          jobs (
            id,
            title,
            company
          )
        `,
        )
        .order("created_at", { ascending: true })
        .limit(200);

      if (!isAllAccountsView) {
        query = query.eq("user_id", targetUserId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Candidate[];
    },
    enabled: isAllAccountsView ? isAdmin : !!targetUserId,
    staleTime: 1000 * 60 * 2,
    refetchOnMount: "always",
  });

  const createCandidate = useMutation({
    mutationFn: async (
      candidate: Omit<Candidate, "id" | "user_id" | "created_at" | "updated_at" | "jobs">,
    ) => {
      if (!targetUserId) throw new Error("Missing target account for candidate creation");
      const { data, error } = await supabase
        .from("candidates")
        .insert({ ...candidate, user_id: targetUserId! })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      toast({ title: "Kandidat tillagd!" });
    },
    onError: (error: Error) => {
      toast({
        title: "Kunde inte lägga till kandidat",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateCandidate = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Candidate> & { id: string }) => {
      const { jobs, ...cleanUpdates } = updates as any;
      const { data, error } = await supabase
        .from("candidates")
        .update(cleanUpdates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    // Optimistic update: move the card instantly, revert on error
    onMutate: async (updated) => {
      await queryClient.cancelQueries({ queryKey: ["candidates"] });
      const previous = queryClient.getQueryData<Candidate[]>(["candidates", targetUserId]);
      if (previous) {
        queryClient.setQueryData<Candidate[]>(["candidates", targetUserId], (old) =>
          (old ?? []).map((c) => (c.id === updated.id ? { ...c, ...updated } : c)),
        );
      }
      return { previous };
    },
    onError: (error: Error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["candidates", targetUserId], context.previous);
      }
      toast({
        title: "Kunde inte uppdatera kandidat",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
    },
  });

  const deleteCandidate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("candidates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      toast({ title: "Kandidat borttagen!" });
    },
    onError: (error: Error) => {
      toast({
        title: "Kunde inte ta bort kandidat",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    candidates: candidatesQuery.data ?? [],
    isLoading: candidatesQuery.isLoading,
    createCandidate,
    updateCandidate,
    deleteCandidate,
  };
}
