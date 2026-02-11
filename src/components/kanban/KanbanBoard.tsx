import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useCandidates, Candidate } from "@/hooks/useCandidates";
import { useJobs } from "@/hooks/useJobs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter } from "lucide-react";
import KanbanColumn from "./KanbanColumn";
import type { Database } from "@/integrations/supabase/types";

type CandidateStatus = Database["public"]["Enums"]["candidate_status"];

const STATUSES: { key: CandidateStatus; label: string }[] = [
  { key: "new", label: "Ny" },
  { key: "screening", label: "Screening" },
  { key: "interview", label: "Intervju" },
  { key: "offer", label: "Erbjudande" },
  { key: "hired", label: "Anställd" },
  { key: "rejected", label: "Avslag" },
];

export default function KanbanBoard() {
  const { candidates, isLoading, updateCandidate } = useCandidates();
  const { jobs } = useJobs();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJobId, setSelectedJobId] = useState<string>("all");
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollRafRef = useRef<number | null>(null);
  const scrollVelocityRef = useRef(0);

  const filteredCandidates = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return candidates.filter((candidate) => {
      const matchesSearch = candidate.name.toLowerCase().includes(query);
      const matchesJob = selectedJobId === "all" || candidate.job_id === selectedJobId;
      return matchesSearch && matchesJob;
    });
  }, [candidates, searchQuery, selectedJobId]);

  const candidatesByStatus = useMemo(() => {
    const map = new Map<CandidateStatus, Candidate[]>();
    for (const s of STATUSES) map.set(s.key, []);
    for (const c of filteredCandidates) {
      map.get(c.status)?.push(c);
    }
    return map;
  }, [filteredCandidates]);

  const statusSet = useMemo(() => new Set(STATUSES.map((status) => status.key)), []);

  const handleStatusChange = useCallback(
    (candidateId: string, newStatus: CandidateStatus) => {
      updateCandidate.mutate({ id: candidateId, status: newStatus });
    },
    [updateCandidate],
  );

  const handleTouchDrop = useCallback(
    (candidate: Candidate, clientX: number, clientY: number) => {
      const element = document.elementFromPoint(clientX, clientY);
      const column = element?.closest<HTMLElement>("[data-kanban-status]");
      const targetStatus = column?.dataset.kanbanStatus as CandidateStatus | undefined;

      if (!targetStatus || !statusSet.has(targetStatus) || targetStatus === candidate.status) {
        return;
      }

      handleStatusChange(candidate.id, targetStatus);
    },
    [handleStatusChange, statusSet],
  );

  const stopAutoScroll = useCallback(() => {
    if (scrollRafRef.current !== null) {
      cancelAnimationFrame(scrollRafRef.current);
      scrollRafRef.current = null;
    }
    scrollVelocityRef.current = 0;
  }, []);

  const handleAutoScroll = useCallback(
    (clientX: number) => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const edge = 96;
      let velocity = 0;

      if (clientX < rect.left + edge) {
        const distance = rect.left + edge - clientX;
        velocity = -Math.min(10, Math.max(4, distance / 3));
      } else if (clientX > rect.right - edge) {
        const distance = clientX - (rect.right - edge);
        velocity = Math.min(10, Math.max(4, distance / 3));
      }

      scrollVelocityRef.current = velocity;

      if (velocity === 0) {
        stopAutoScroll();
        return;
      }

      if (scrollRafRef.current === null) {
        const step = () => {
          const el = scrollContainerRef.current;
          if (!el || scrollVelocityRef.current === 0) {
            stopAutoScroll();
            return;
          }
          el.scrollLeft += scrollVelocityRef.current;
          scrollRafRef.current = requestAnimationFrame(step);
        };
        scrollRafRef.current = requestAnimationFrame(step);
      }
    },
    [stopAutoScroll],
  );

  useEffect(() => () => stopAutoScroll(), [stopAutoScroll]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Laddar...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Filters */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Sök kandidat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={selectedJobId} onValueChange={setSelectedJobId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrera på jobb" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla jobb</SelectItem>
              {jobs.map((job) => (
                <SelectItem key={job.id} value={job.id}>
                  {job.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Kanban Columns */}
      <div ref={scrollContainerRef} className="flex-1 overflow-x-auto">
        <div className="flex gap-4 min-w-max pb-4">
          {STATUSES.map((status) => (
            <KanbanColumn
              key={status.key}
              status={status.key}
              label={status.label}
              candidates={candidatesByStatus.get(status.key) ?? []}
              onStatusChange={handleStatusChange}
              onTouchDrop={handleTouchDrop}
              onTouchDragMove={handleAutoScroll}
              onTouchDragEnd={stopAutoScroll}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
