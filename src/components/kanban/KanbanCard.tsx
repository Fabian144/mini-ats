import { memo, useRef, useState } from "react";
import { Candidate } from "@/hooks/useCandidates";
import { safeExternalUrl } from "@/lib/utils";
import { Linkedin, Mail, Phone, Briefcase } from "lucide-react";

interface KanbanCardProps {
  candidate: Candidate;
  onTouchDrop: (candidate: Candidate, clientX: number, clientY: number) => void;
  onTouchDragMove: (clientX: number) => void;
  onTouchDragEnd: () => void;
}

const KanbanCard = memo(function KanbanCard({
  candidate,
  onTouchDrop,
  onTouchDragMove,
  onTouchDragEnd,
}: KanbanCardProps) {
  const ignoreTouchRef = useRef(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchTimerRef = useRef<number | null>(null);
  const [isTouchDragging, setIsTouchDragging] = useState(false);
  const overlayStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("candidateId", candidate.id);
  };

  const handleDrag = (e: React.DragEvent) => {
    onTouchDragMove(e.clientX);
  };

  const handleDragEnd = () => {
    onTouchDragEnd();
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    ignoreTouchRef.current = !!target?.closest("a");
    if (ignoreTouchRef.current) return;

    const touch = e.touches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };

    if (touchTimerRef.current) {
      window.clearTimeout(touchTimerRef.current);
    }

    touchTimerRef.current = window.setTimeout(() => {
      const card = cardRef.current;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const overlay = card.cloneNode(true) as HTMLDivElement;
      overlay.classList.add("kanban-card--overlay");
      overlay.style.left = `${rect.left}px`;
      overlay.style.top = `${rect.top}px`;
      overlay.style.width = `${rect.width}px`;
      overlay.style.height = `${rect.height}px`;
      document.body.appendChild(overlay);
      overlayRef.current = overlay;
      overlayStartRef.current = { x: rect.left, y: rect.top };
      setIsTouchDragging(true);
    }, 160);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (ignoreTouchRef.current) return;
    const touch = e.touches[0];
    if (!touch) return;

    if (!isTouchDragging) {
      const start = touchStartRef.current;
      if (!start) return;
      const deltaX = Math.abs(touch.clientX - start.x);
      const deltaY = Math.abs(touch.clientY - start.y);

      if (deltaX > 10 || deltaY > 10) {
        if (touchTimerRef.current) {
          window.clearTimeout(touchTimerRef.current);
          touchTimerRef.current = null;
        }
      }
      return;
    }

    e.preventDefault();
    const start = touchStartRef.current;
    const overlayStart = overlayStartRef.current;
    if (!start || !overlayStart || !overlayRef.current) return;
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    overlayRef.current.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;
    onTouchDragMove(touch.clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (ignoreTouchRef.current) {
      ignoreTouchRef.current = false;
      return;
    }

    if (touchTimerRef.current) {
      window.clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }

    const touch = e.changedTouches[0];
    if (!touch) return;
    if (isTouchDragging) {
      onTouchDrop(candidate, touch.clientX, touch.clientY);
      setIsTouchDragging(false);
      onTouchDragEnd();
    }

    if (overlayRef.current) {
      overlayRef.current.remove();
      overlayRef.current = null;
      overlayStartRef.current = null;
    }
  };

  const handleTouchCancel = () => {
    if (touchTimerRef.current) {
      window.clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
    setIsTouchDragging(false);
    onTouchDragEnd();
    if (overlayRef.current) {
      overlayRef.current.remove();
      overlayRef.current = null;
      overlayStartRef.current = null;
    }
  };

  const safeLinkedinUrl = safeExternalUrl(candidate.linkedin_url);

  return (
    <div
      ref={cardRef}
      draggable
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      className={`kanban-card animate-fade-in${isTouchDragging ? " is-touch-dragging" : ""}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-medium text-foreground">{candidate.name}</h4>
        {safeLinkedinUrl && (
          <a
            href={safeLinkedinUrl}
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
});

export default KanbanCard;
