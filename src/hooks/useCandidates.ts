import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type CandidateStatus = Database['public']['Enums']['candidate_status'];

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
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const candidatesQuery = useQuery({
    queryKey: ['candidates', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('candidates')
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
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      return data as Candidate[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });

  const createCandidate = useMutation({
    mutationFn: async (
      candidate: Omit<Candidate, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'jobs'>,
    ) => {
      const { data, error } = await supabase
        .from('candidates')
        .insert({ ...candidate, user_id: user!.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      toast({ title: 'Kandidat tillagd!' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Kunde inte lägga till kandidat',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateCandidate = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Candidate> & { id: string }) => {
      const { jobs, ...cleanUpdates } = updates as any;
      const { data, error } = await supabase
        .from('candidates')
        .update(cleanUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Kunde inte uppdatera kandidat',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteCandidate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('candidates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      toast({ title: 'Kandidat borttagen!' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Kunde inte ta bort kandidat',
        description: error.message,
        variant: 'destructive',
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
