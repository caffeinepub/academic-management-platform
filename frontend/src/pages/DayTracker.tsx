import React, { useState, useMemo } from 'react';
import { format, startOfWeek, endOfWeek, addDays, isSameDay, isWithinInterval, parseISO } from 'date-fns';
import { Plus, ChevronLeft, ChevronRight, Clock, BookOpen, Pencil, Trash2, UserCircle, CalendarDays, Calendar, Timer, AlarmClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useGetDayEntries, useAddDayEntry, useUpdateDayEntry, useDeleteDayEntry } from '@/hooks/useQueries';
import type { LocalDayEntry } from '@/hooks/useQueries';
import { useUser } from '@/contexts/UserContext';

// ─── StatsPanel ───────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: boolean;
}

function StatCard({ label, value, icon, accent = false }: StatCardProps) {
  return (
    <Card className={accent ? 'border-primary/30 bg-primary/5' : ''}>
      <CardContent className="pt-4 pb-4 px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-none mb-2">
              {label}
            </p>
            <p className={`text-2xl font-bold font-display tabular-nums ${accent ? 'text-primary' : 'text-foreground'}`}>
              {value}
            </p>
          </div>
          <div className={`shrink-0 rounded-lg p-2 ${accent ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface StatsPanelProps {
  entries: LocalDayEntry[];
}

function StatsPanel({ entries }: StatsPanelProps) {
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  const allDaysHours = useMemo(
    () => entries.reduce((sum, e) => sum + e.hours, 0),
    [entries]
  );

  const thisWeekHours = useMemo(
    () =>
      entries
        .filter((e) => {
          try {
            const d = parseISO(e.date);
            return isWithinInterval(d, { start: weekStart, end: weekEnd });
          } catch {
            return false;
          }
        })
        .reduce((sum, e) => sum + e.hours, 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entries, weekStart.toISOString(), weekEnd.toISOString()]
  );

  const todayHours = useMemo(
    () => entries.filter((e) => e.date === todayStr).reduce((sum, e) => sum + e.hours, 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entries, todayStr]
  );

  const todayMinutes = Math.round(todayHours * 60);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard
        label="All Days Hours"
        value={allDaysHours.toFixed(1)}
        icon={<CalendarDays className="h-4 w-4" />}
      />
      <StatCard
        label="This Week Hours"
        value={thisWeekHours.toFixed(1)}
        icon={<Calendar className="h-4 w-4" />}
      />
      <StatCard
        label="Today Hours"
        value={todayHours.toFixed(1)}
        icon={<Clock className="h-4 w-4" />}
        accent
      />
      <StatCard
        label="Today Minutes"
        value={String(todayMinutes)}
        icon={<Timer className="h-4 w-4" />}
        accent
      />
    </div>
  );
}

// ─── EntryModal ───────────────────────────────────────────────────────────────
interface EntryModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (hours: number, description: string) => void;
  initialHours?: number;
  initialDescription?: string;
  isEditing?: boolean;
  isSaving?: boolean;
}

function EntryModal({
  open,
  onClose,
  onSave,
  initialHours = 1,
  initialDescription = '',
  isEditing = false,
  isSaving = false,
}: EntryModalProps) {
  const [hours, setHours] = useState(initialHours);
  const [description, setDescription] = useState(initialDescription);

  React.useEffect(() => {
    if (open) {
      setHours(initialHours);
      setDescription(initialDescription);
    }
  }, [open, initialHours, initialDescription]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hours <= 0 || hours > 24) {
      toast.error('Hours must be between 0.1 and 24');
      return;
    }
    onSave(hours, description);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Entry' : 'Log Learning Hours'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="hours">Hours Spent</Label>
            <Input
              id="hours"
              type="number"
              min="0.1"
              max="24"
              step="0.1"
              value={hours}
              onChange={(e) => setHours(parseFloat(e.target.value) || 0)}
              required
              disabled={isSaving}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="desc">
              Activity / Description{' '}
              <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Textarea
              id="desc"
              placeholder="What did you study or work on?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={isSaving}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving
                ? isEditing
                  ? 'Saving…'
                  : 'Logging…'
                : isEditing
                ? 'Save Changes'
                : 'Log Hours'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── DailySummary ─────────────────────────────────────────────────────────────
interface DailySummaryProps {
  entries: LocalDayEntry[];
  date: Date;
}

function DailySummary({ entries, date }: DailySummaryProps) {
  const totalHours = useMemo(() => entries.reduce((sum, e) => sum + e.hours, 0), [entries]);

  if (entries.length === 0) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-primary flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Daily Summary — {format(date, 'EEEE, MMM d')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total learning time</span>
          <Badge variant="default" className="font-mono">
            {totalHours.toFixed(1)}h
          </Badge>
        </div>
        {entries
          .filter((e) => e.description)
          .map((e) => (
            <div key={e.id} className="flex items-start gap-2 text-sm">
              <BookOpen className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
              <span className="text-muted-foreground">
                {e.description}{' '}
                <span className="text-foreground font-medium">({e.hours}h)</span>
              </span>
            </div>
          ))}
      </CardContent>
    </Card>
  );
}

// ─── Entry Card ───────────────────────────────────────────────────────────────
interface EntryCardProps {
  entry: LocalDayEntry;
  onEdit: (entry: LocalDayEntry) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

function EntryCard({ entry, onEdit, onDelete, isDeleting }: EntryCardProps) {
  return (
    <Card>
      <CardContent className="py-3 px-4 flex items-start gap-3">
        <Badge variant="secondary" className="font-mono shrink-0 mt-0.5">
          {entry.hours.toFixed(1)}h
        </Badge>
        <div className="flex-1 min-w-0">
          {entry.description ? (
            <p className="text-sm text-foreground leading-snug">{entry.description}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">No description</p>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => onEdit(entry)}
            title="Edit entry"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(entry.id)}
            disabled={isDeleting}
            title="Delete entry"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DayTracker() {
  const { userId } = useUser();
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LocalDayEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data: entries = [] } = useGetDayEntries();
  const addEntry = useAddDayEntry();
  const updateEntry = useUpdateDayEntry();
  const deleteEntry = useDeleteDayEntry();

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i)),
    [currentWeekStart]
  );

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

  const selectedEntries = useMemo(
    () => entries.filter((e) => e.date === selectedDateStr),
    [entries, selectedDateStr]
  );

  const weeklyHours = useMemo(() => {
    const map: Record<string, number> = {};
    weekDays.forEach((d) => {
      const key = format(d, 'yyyy-MM-dd');
      map[key] = entries.filter((e) => e.date === key).reduce((s, e) => s + e.hours, 0);
    });
    return map;
  }, [entries, weekDays]);

  const openAddModal = () => {
    setEditingEntry(null);
    setModalOpen(true);
  };

  const openEditModal = (entry: LocalDayEntry) => {
    setEditingEntry(entry);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingEntry(null);
  };

  const handleSave = (hours: number, description: string) => {
    if (editingEntry) {
      updateEntry.mutate(
        { id: editingEntry.id, hours, description },
        {
          onSuccess: () => {
            toast.success('Entry updated');
            closeModal();
          },
          onError: () => toast.error('Failed to update entry'),
        }
      );
    } else {
      addEntry.mutate(
        { date: selectedDateStr, hours, description },
        {
          onSuccess: () => {
            toast.success('Hours logged!');
            closeModal();
          },
          onError: () => toast.error('Failed to log hours'),
        }
      );
    }
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteEntry.mutate(deleteTarget, {
      onSuccess: () => {
        toast.success('Entry deleted');
        setDeleteTarget(null);
      },
      onError: () => toast.error('Failed to delete entry'),
    });
  };

  const isSaving = addEntry.isPending || updateEntry.isPending;

  // No user state
  if (!userId) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <UserCircle className="h-16 w-16 text-muted-foreground/40" />
        <div>
          <h2 className="font-display text-xl font-semibold text-foreground">Sign in to track your progress</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Your learning entries are saved per user. Please set up your profile to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Day Tracker</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Log your daily learning hours</p>
        </div>
        <Button onClick={openAddModal} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> Log Hours
        </Button>
      </div>

      {/* Stats Summary Panel */}
      <StatsPanel entries={entries} />

      {/* Week Navigator */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentWeekStart((d) => addDays(d, -7))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              {format(currentWeekStart, 'MMM d')} –{' '}
              {format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentWeekStart((d) => addDays(d, 7))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day) => {
              const key = format(day, 'yyyy-MM-dd');
              const hrs = weeklyHours[key] || 0;
              const isSelected = isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              return (
                <button
                  key={key}
                  onClick={() => setSelectedDate(day)}
                  className={`flex flex-col items-center rounded-lg py-2 px-1 text-xs transition-colors ${
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : isToday
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-muted'
                  }`}
                >
                  <span className="font-medium">{format(day, 'EEE')}</span>
                  <span className="text-[10px] opacity-70">{format(day, 'd')}</span>
                  {hrs > 0 && (
                    <span
                      className={`mt-1 text-[10px] font-semibold ${
                        isSelected ? 'text-primary-foreground' : 'text-primary'
                      }`}
                    >
                      {hrs.toFixed(1)}h
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Entry List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {format(selectedDate, 'EEEE, MMMM d')}
          </h2>
          <span className="text-xs text-muted-foreground">
            {selectedEntries.length} entr{selectedEntries.length === 1 ? 'y' : 'ies'}
          </span>
        </div>

        {selectedEntries.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 flex flex-col items-center gap-3 text-center">
              <Clock className="h-8 w-8 text-muted-foreground/40" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">No entries for this day</p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">
                  Click "Log Hours" to add your first entry
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={openAddModal}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Entry
              </Button>
            </CardContent>
          </Card>
        ) : (
          selectedEntries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onEdit={openEditModal}
              onDelete={(id) => setDeleteTarget(id)}
              isDeleting={deleteEntry.isPending && deleteTarget === entry.id}
            />
          ))
        )}
      </div>

      {/* Daily Summary */}
      <DailySummary entries={selectedEntries} date={selectedDate} />

      {/* Entry Modal */}
      <EntryModal
        open={modalOpen}
        onClose={closeModal}
        onSave={handleSave}
        initialHours={editingEntry?.hours ?? 1}
        initialDescription={editingEntry?.description ?? ''}
        isEditing={!!editingEntry}
        isSaving={isSaving}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this learning entry. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteEntry.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
              disabled={deleteEntry.isPending}
            >
              {deleteEntry.isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
