import { Candidate } from '@/hooks/useCandidates';
import { Linkedin, Mail, Phone, Briefcase } from 'lucide-react';

interface KanbanCardProps {
  candidate: Candidate;
}

export default function KanbanCard({ candidate }: KanbanCardProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('candidateId', candidate.id);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="kanban-card animate-fade-in"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-medium text-foreground">{candidate.name}</h4>
        {candidate.linkedin_url && (
          <a
            href={candidate.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Linkedin className="w-4 h-4" />
          </a>
        )}
      </div>

      {candidate.jobs && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
          <Briefcase className="w-3 h-3" />
          <span>{candidate.jobs.title}</span>
          {candidate.jobs.company && (
            <span className="text-muted-foreground/70">@ {candidate.jobs.company}</span>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        {candidate.email && (
          <div className="flex items-center gap-1">
            <Mail className="w-3 h-3" />
            <span className="truncate max-w-[120px]">{candidate.email}</span>
          </div>
        )}
        {candidate.phone && (
          <div className="flex items-center gap-1">
            <Phone className="w-3 h-3" />
            <span>{candidate.phone}</span>
          </div>
        )}
      </div>

      {candidate.notes && (
        <p className="mt-2 text-xs text-muted-foreground line-clamp-2 border-t border-border pt-2">
          {candidate.notes}
        </p>
      )}
    </div>
  );
}
