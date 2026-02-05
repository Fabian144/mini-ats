import { Candidate } from '@/hooks/useCandidates';
import KanbanCard from './KanbanCard';
import type { Database } from '@/integrations/supabase/types';

type CandidateStatus = Database['public']['Enums']['candidate_status'];

interface KanbanColumnProps {
  status: CandidateStatus;
  label: string;
  candidates: Candidate[];
  onStatusChange: (candidateId: string, newStatus: CandidateStatus) => void;
}

const statusColors: Record<CandidateStatus, string> = {
  new: 'bg-status-new',
  screening: 'bg-status-screening',
  interview: 'bg-status-interview',
  offer: 'bg-status-offer',
  hired: 'bg-status-hired',
  rejected: 'bg-status-rejected',
};

export default function KanbanColumn({ status, label, candidates, onStatusChange }: KanbanColumnProps) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const candidateId = e.dataTransfer.getData('candidateId');
    if (candidateId) {
      onStatusChange(candidateId, status);
    }
  };

  return (
    <div 
      className="kanban-column w-72 flex-shrink-0"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-3 h-3 rounded-full ${statusColors[status]}`} />
        <h3 className="font-semibold text-foreground">{label}</h3>
        <span className="ml-auto text-sm text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
          {candidates.length}
        </span>
      </div>

      <div className="space-y-3">
        {candidates.map((candidate) => (
          <KanbanCard key={candidate.id} candidate={candidate} />
        ))}
        {candidates.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Inga kandidater
          </div>
        )}
      </div>
    </div>
  );
}
