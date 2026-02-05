import DashboardLayout from '@/components/layout/DashboardLayout';
import KanbanBoard from '@/components/kanban/KanbanBoard';

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="p-6 h-screen flex flex-col">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Rekryteringsöversikt</h1>
          <p className="text-muted-foreground">Dra och släpp kandidater för att ändra status</p>
        </div>
        <div className="flex-1 overflow-hidden">
          <KanbanBoard />
        </div>
      </div>
    </DashboardLayout>
  );
}
