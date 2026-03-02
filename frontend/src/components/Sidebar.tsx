import { useState } from 'react';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import {
  LayoutDashboard,
  MessageSquare,
  Upload,
  CalendarDays,
  ClipboardList,
  Clock,
  BookOpen,
  UserCircle,
  X,
} from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import UserProfileModal from './UserProfileModal';

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'AI Chat', icon: MessageSquare, path: '/chat' },
  { label: 'Upload Timetable', icon: Upload, path: '/timetable/upload' },
  { label: 'Manual Timetable', icon: CalendarDays, path: '/timetable/manual' },
  { label: 'Assignments', icon: ClipboardList, path: '/assignments' },
  { label: 'Day Tracker', icon: Clock, path: '/day-tracker' },
  { label: 'Guide', icon: BookOpen, path: '/guide' },
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { userId } = useUser();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleNav = (path: string) => {
    navigate({ to: path });
    onMobileClose();
  };

  return (
    <>
      <aside
        className={`
          fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-sidebar text-sidebar-foreground
          transition-transform duration-300 ease-in-out
          lg:static lg:translate-x-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
          <img
            src="/assets/generated/logo-mark.dim_128x128.png"
            alt="AcadMind"
            className="h-8 w-8 rounded-lg object-cover"
          />
          <span className="font-display text-lg font-bold tracking-tight">AcadMind</span>
          {/* Mobile close */}
          <button
            onClick={onMobileClose}
            className="ml-auto rounded-md p-1 text-sidebar-foreground/60 hover:text-sidebar-foreground lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.path === '/'
                ? currentPath === '/'
                : currentPath.startsWith(item.path);
            return (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                className={`
                  flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium
                  transition-colors text-left
                  ${
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                  }
                `}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User profile section */}
        <div className="border-t border-sidebar-border p-3">
          <button
            onClick={() => setProfileOpen(true)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
          >
            <UserCircle className="h-4 w-4 shrink-0" />
            <div className="flex-1 min-w-0 text-left">
              {userId ? (
                <>
                  <p className="truncate text-xs font-semibold text-sidebar-foreground">
                    {userId.split('@')[0]}
                  </p>
                  <p className="truncate text-[10px] text-sidebar-foreground/50">{userId}</p>
                </>
              ) : (
                <p className="text-xs text-sidebar-foreground/60">Set up profile</p>
              )}
            </div>
          </button>
        </div>
      </aside>

      <UserProfileModal open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}
