import { Link, useRouterState } from '@tanstack/react-router';
import {
  LayoutDashboard,
  MessageSquare,
  Calendar,
  Upload,
  ClipboardList,
  X,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  CalendarDays,
  Key,
  Eye,
  EyeOff,
  Trash2,
  Save,
  Loader2,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUser } from '@/contexts/UserContext';
import { toast } from 'sonner';

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

interface NavItem {
  label: string;
  icon: React.ElementType;
  path?: string;
  children?: { label: string; icon: React.ElementType; path: string }[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Chat', icon: MessageSquare, path: '/chat' },
  {
    label: 'Timetable',
    icon: Calendar,
    children: [
      { label: 'OCR Upload', icon: Upload, path: '/timetable/upload' },
      { label: 'Manual Slots', icon: Calendar, path: '/timetable/manual' },
    ],
  },
  { label: 'Assignments', icon: ClipboardList, path: '/assignments' },
  { label: 'Day Tracker', icon: CalendarDays, path: '/day-tracker' },
];

function maskApiKey(key: string): string {
  if (key.length <= 8) return '••••••••';
  return key.slice(0, 4) + '••••••••' + key.slice(-4);
}

export default function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const [timetableOpen, setTimetableOpen] = useState(true);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const { geminiApiKey, updateGeminiApiKey, clearGeminiApiKey } = useUser();

  const isActive = (path: string) => currentPath === path;
  const isTimetableActive = currentPath.startsWith('/timetable');

  const handleSaveKey = async () => {
    const trimmed = apiKeyInput.trim();
    if (!trimmed) {
      toast.error('Please enter a valid API key');
      return;
    }
    setIsSaving(true);
    try {
      updateGeminiApiKey(trimmed);
      setApiKeyInput('');
      toast.success('Gemini API key saved successfully');
    } catch {
      toast.error('Failed to save API key');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteKey = () => {
    clearGeminiApiKey();
    setApiKeyInput('');
    toast.success('Gemini API key removed');
  };

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-sidebar transition-transform duration-300 ease-in-out lg:static lg:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar-primary">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-display font-bold text-white leading-tight">AcadMind</p>
            <p className="text-xs text-white/60 leading-tight">Academic Platform</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onMobileClose}
          className="lg:hidden text-white hover:bg-sidebar-accent h-8 w-8"
        >
          <X className="h-4 w-4 text-white" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin">
        <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-white/50">
          Navigation
        </p>
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            if (item.children) {
              return (
                <li key={item.label}>
                  <button
                    onClick={() => setTimetableOpen((o) => !o)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-white',
                      isTimetableActive
                        ? 'bg-sidebar-accent'
                        : 'hover:bg-sidebar-accent'
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0 text-white" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {timetableOpen ? (
                      <ChevronDown className="h-3.5 w-3.5 text-white/70" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-white/70" />
                    )}
                  </button>
                  {timetableOpen && (
                    <ul className="mt-0.5 ml-4 space-y-0.5 border-l border-sidebar-border pl-3">
                      {item.children.map((child) => (
                        <li key={child.path}>
                          <Link
                            to={child.path}
                            onClick={onMobileClose}
                            className={cn(
                              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors text-white',
                              isActive(child.path)
                                ? 'bg-sidebar-primary font-medium'
                                : 'hover:bg-sidebar-accent'
                            )}
                          >
                            <child.icon className="h-3.5 w-3.5 shrink-0 text-white" />
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            }

            return (
              <li key={item.path}>
                <Link
                  to={item.path!}
                  onClick={onMobileClose}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-white',
                    isActive(item.path!)
                      ? 'bg-sidebar-primary'
                      : 'hover:bg-sidebar-accent'
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0 text-white" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Gemini API Key Section */}
      <div className="border-t border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-2 mb-3">
          <Key className="h-3.5 w-3.5 text-white/60 shrink-0" />
          <p className="text-xs font-semibold uppercase tracking-wider text-white/50">
            Gemini API Key
          </p>
        </div>

        {geminiApiKey ? (
          /* Key is stored — show masked value + delete button */
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2">
              <span className="flex-1 text-xs font-mono text-white/80 truncate">
                {maskApiKey(geminiApiKey)}
              </span>
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-green-400/20">
                <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteKey}
              className="w-full h-8 text-xs text-white/60 hover:text-red-400 hover:bg-red-400/10 gap-1.5"
            >
              <Trash2 className="h-3 w-3" />
              Remove Key
            </Button>
          </div>
        ) : (
          /* No key — show input + save button */
          <div className="space-y-2">
            <div className="relative">
              <Input
                type={showKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveKey();
                }}
                placeholder="AIza..."
                className="h-8 text-xs pr-8 bg-white/10 border-white/20 text-white placeholder:text-white/30 focus-visible:ring-white/30"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                tabIndex={-1}
              >
                {showKey ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            <Button
              size="sm"
              onClick={handleSaveKey}
              disabled={!apiKeyInput.trim() || isSaving}
              className="w-full h-8 text-xs bg-sidebar-primary hover:bg-sidebar-primary/80 text-white gap-1.5"
            >
              {isSaving ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Save className="h-3 w-3" />
              )}
              Save Key
            </Button>
          </div>
        )}
      </div>

      {/* Sidebar footer */}
      <div className="border-t border-sidebar-border px-4 py-3">
        <p className="text-xs text-white/40 text-center">
          Academic Management Platform
        </p>
      </div>
    </aside>
  );
}
