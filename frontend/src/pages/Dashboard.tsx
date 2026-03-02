import { useNavigate } from '@tanstack/react-router';
import {
  MessageSquare,
  Upload,
  Plus,
  ClipboardList,
  Clock,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  UserCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetAllSlots, useGetAllTasks } from '../hooks/useQueries';
import type { LocalSlot, LocalTask } from '../hooks/useQueries';
import { useUser } from '../contexts/UserContext';

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getDaysUntil(dateStr: string): number {
  if (!dateStr) return Infinity;
  const due = new Date(dateStr + 'T00:00:00').getTime();
  return Math.ceil((due - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { userId } = useUser();
  const { data: slots = [], isLoading: slotsLoading } = useGetAllSlots();
  const { data: tasks = [], isLoading: tasksLoading } = useGetAllTasks();

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todaySlots = (slots as LocalSlot[])
    .filter((s) => s.dayOfWeek.toLowerCase() === today.toLowerCase())
    .sort((a, b) => a.startTime - b.startTime);

  const upcomingTasks = (tasks as LocalTask[])
    .filter((t) => !t.completed && t.dueDate)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 3);

  const pendingCount = tasks.filter((t) => !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed).length;

  const quickActions = [
    {
      label: 'Open Chat',
      icon: MessageSquare,
      path: '/chat',
      color: 'bg-primary/10 text-primary hover:bg-primary/20',
    },
    {
      label: 'Upload Timetable',
      icon: Upload,
      path: '/timetable/upload',
      color: 'bg-accent text-accent-foreground hover:bg-accent/80',
    },
    {
      label: 'Create Slot',
      icon: Plus,
      path: '/timetable/manual',
      color: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    },
    {
      label: 'View Assignments',
      icon: ClipboardList,
      path: '/assignments',
      color: 'bg-primary/10 text-primary hover:bg-primary/20',
    },
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-sidebar text-sidebar-foreground">
        <div className="absolute inset-0 opacity-20">
          <img
            src="/assets/generated/dashboard-hero.dim_800x400.png"
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
        <div className="relative px-8 py-8">
          <div className="flex items-center gap-3 mb-3">
            <img
              src="/assets/generated/logo-mark.dim_128x128.png"
              alt="AcadMind"
              className="h-10 w-10 rounded-xl object-cover"
            />
            <div>
              <h1 className="font-display text-2xl font-bold">
                Welcome back{userId ? `, ${userId.split('@')[0]}` : ''}!
              </h1>
              <p className="text-sidebar-foreground/70 text-sm">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
          <div className="flex gap-6 mt-4">
            <div className="text-center">
              <p className="text-2xl font-bold font-display">{todaySlots.length}</p>
              <p className="text-xs text-sidebar-foreground/60">Classes Today</p>
            </div>
            <div className="w-px bg-sidebar-border" />
            <div className="text-center">
              <p className="text-2xl font-bold font-display">{pendingCount}</p>
              <p className="text-xs text-sidebar-foreground/60">Pending Tasks</p>
            </div>
            <div className="w-px bg-sidebar-border" />
            <div className="text-center">
              <p className="text-2xl font-bold font-display">{completedCount}</p>
              <p className="text-xs text-sidebar-foreground/60">Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* No user banner */}
      {!userId && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-4 py-3">
          <UserCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            Set up your profile to save tasks and timetable data per user. Go to{' '}
            <button
              onClick={() => navigate({ to: '/assignments' })}
              className="underline font-medium"
            >
              Assignments
            </button>{' '}
            or{' '}
            <button
              onClick={() => navigate({ to: '/timetable/manual' })}
              className="underline font-medium"
            >
              Timetable
            </button>{' '}
            to get started.
          </p>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="font-display font-semibold text-foreground mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickActions.map((action) => (
            <button
              key={action.path}
              onClick={() => navigate({ to: action.path })}
              className={`flex flex-col items-center gap-2 rounded-xl p-4 text-sm font-medium transition-all hover:shadow-card-hover ${action.color}`}
            >
              <action.icon className="h-6 w-6" />
              <span className="text-center leading-tight">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Schedule */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <Clock className="h-4 w-4 text-primary" />
              Today's Schedule
              <Badge variant="secondary" className="ml-auto text-xs">
                {today}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {slotsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : !userId ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <UserCircle className="h-10 w-10 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">Set up your profile to see your schedule</p>
              </div>
            ) : todaySlots.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <BookOpen className="h-10 w-10 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No classes scheduled for today</p>
                <Button
                  variant="link"
                  size="sm"
                  className="mt-1 text-primary"
                  onClick={() => navigate({ to: '/timetable/manual' })}
                >
                  Add a slot →
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {todaySlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <BookOpen className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{slot.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(slot.startTime)} · {slot.location || 'No location'}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {slot.durationMinutes}m
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <ClipboardList className="h-4 w-4 text-primary" />
              Upcoming Tasks
              {pendingCount > 0 && (
                <Badge className="ml-auto text-xs">{pendingCount} pending</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : !userId ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <UserCircle className="h-10 w-10 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">Set up your profile to see your tasks</p>
              </div>
            ) : upcomingTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="h-10 w-10 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">
                  {tasks.length === 0 ? 'No tasks yet' : 'All tasks completed! 🎉'}
                </p>
                <Button
                  variant="link"
                  size="sm"
                  className="mt-1 text-primary"
                  onClick={() => navigate({ to: '/assignments' })}
                >
                  Add a task →
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingTasks.map((task) => {
                  const daysUntil = task.dueDate ? getDaysUntil(task.dueDate) : null;
                  const isUrgent = daysUntil !== null && daysUntil <= 2;
                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5"
                    >
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                          isUrgent ? 'bg-destructive/10' : 'bg-primary/10'
                        }`}
                      >
                        {isUrgent ? (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        ) : (
                          <ClipboardList className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Due {task.dueDate ? formatDate(task.dueDate) : 'No date'}
                        </p>
                      </div>
                      {daysUntil !== null && (
                        <Badge
                          variant={isUrgent ? 'destructive' : 'secondary'}
                          className="shrink-0 text-xs"
                        >
                          {daysUntil === 0
                            ? 'Today'
                            : daysUntil === 1
                            ? 'Tomorrow'
                            : `${daysUntil}d`}
                        </Badge>
                      )}
                    </div>
                  );
                })}
                {pendingCount > 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-primary"
                    onClick={() => navigate({ to: '/assignments' })}
                  >
                    View all {pendingCount} tasks →
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
