import { ReactNode, memo, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Users, Briefcase, LayoutDashboard, LogOut, UserCog } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Kanban' },
  { href: '/jobs', icon: Briefcase, label: 'Jobb' },
  { href: '/candidates', icon: Users, label: 'Kandidater' },
];

const DashboardLayout = memo(function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, signOut, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Prefetch both candidates and jobs as soon as the layout mounts
  // so navigating between Dashboard/Jobs/Candidates is instant
  useEffect(() => {
    if (!user) return;
    const uid = user.id;

    queryClient.prefetchQuery({
      queryKey: ['candidates', uid],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('candidates')
          .select(
            'id, user_id, job_id, name, email, phone, linkedin_url, notes, status, created_at, updated_at, jobs(id, title, company)',
          )
          .order('created_at', { ascending: false })
          .limit(200);
        if (error) throw error;
        return data;
      },
      staleTime: 1000 * 60 * 2,
    });

    queryClient.prefetchQuery({
      queryKey: ['jobs', uid],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('jobs')
          .select('id, user_id, title, company, description, location, created_at, updated_at')
          .order('created_at', { ascending: false })
          .limit(200);
        if (error) throw error;
        return data;
      },
      staleTime: 1000 * 60 * 2,
    });
  }, [user, queryClient]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
              <Users className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg">TalentTrack</h1>
              <p className="text-xs text-sidebar-foreground/60">Mini ATS</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}

          {isAdmin && (
            <Link
              to="/admin"
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                location.pathname === '/admin'
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
              )}
            >
              <UserCog className="w-5 h-5" />
              <span className="font-medium">Admin</span>
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-4 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center">
              <span className="text-sm font-medium">{user?.email?.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.email}</p>
              <p className="text-xs text-sidebar-foreground/60">{isAdmin ? 'Admin' : 'Kund'}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logga ut
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
});

export default DashboardLayout;
