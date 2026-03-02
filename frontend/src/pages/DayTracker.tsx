import { useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  CalendarDays,
  Loader2,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { toast } from 'sonner';
import {
  useGetDayEntries,
  useAddDayEntry,
  useUpdateDayEntry,
  useDeleteDayEntry,
} from '../hooks/useQueries';
import type { DayEntry } from '../backend';

const USER_ID = 'default-user';

function dateToInt(date: Date): bigint {
  // Store as start-of-day UTC ms as bigint
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return BigInt(d.getTime());
}

function intToDate(val: bigint): Date {
  return new Date(Number(val));
}

function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getWeekDays(anchor: Date): Date[] {
  const day = anchor.getDay(); // 0=Sun
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

interface EntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
  entry?: DayEntry | null;
  onSave: (description: string) => Promise<void>;
  isSaving: boolean;
}

function EntryModal({ open, onOpenChange, date, entry, onSave, isSaving }: EntryModalProps) {
  const [description, setDescription] = useState(entry?.taskDescription ?? '');

  // Reset when entry changes
  useState(() => {
    setDescription(entry?.taskDescription ?? '');
  });

  const handleSave = async () => {
    if (!description.trim()) return;
    await onSave(description.trim());
    setDescription('');
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!isSaving) { onOpenChange(o); if (!o) setDescription(entry?.taskDescription ?? ''); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {entry ? 'Edit Entry' : 'Add Entry'}
          </DialogTitle>
          <DialogDescription>
            {formatDisplayDate(date)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="entry-desc">What did you work on?</Label>
            <Textarea
              id="entry-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your tasks, study sessions, or activities for this day..."
              rows={4}
              className="resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!description.trim() || isSaving} className="gap-2">
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {entry ? 'Update' : 'Add Entry'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function DayTracker() {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [weekAnchor, setWeekAnchor] = useState<Date>(today);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DayEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DayEntry | null>(null);
  const [savingEntry, setSavingEntry] = useState(false);

  const { data: entries = [], isLoading } = useGetDayEntries(USER_ID);
  const addEntry = useAddDayEntry();
  const updateEntry = useUpdateDayEntry();
  const deleteEntry = useDeleteDayEntry();

  const weekDays = useMemo(() => getWeekDays(weekAnchor), [weekAnchor]);

  // Map date int -> entries
  const entriesByDate = useMemo(() => {
    const map = new Map<string, DayEntry[]>();
    for (const entry of entries) {
      const d = intToDate(entry.date);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(entry);
    }
    return map;
  }, [entries]);

  const getEntriesForDate = (date: Date): DayEntry[] => {
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return entriesByDate.get(key) ?? [];
  };

  const selectedEntries = getEntriesForDate(selectedDate);

  const handleSave = async (description: string) => {
    setSavingEntry(true);
    try {
      if (editingEntry) {
        await updateEntry.mutateAsync({ entryId: editingEntry.id, newDescription: description });
        toast.success('Entry updated');
      } else {
        await addEntry.mutateAsync({
          userId: USER_ID,
          date: dateToInt(selectedDate),
          taskDescription: description,
        });
        toast.success('Entry added');
      }
      setModalOpen(false);
      setEditingEntry(null);
    } catch {
      toast.error('Failed to save entry');
    } finally {
      setSavingEntry(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteEntry.mutateAsync(deleteTarget.id);
      toast.success('Entry deleted');
    } catch {
      toast.error('Failed to delete entry');
    } finally {
      setDeleteTarget(null);
    }
  };

  const prevWeek = () => {
    const d = new Date(weekAnchor);
    d.setDate(d.getDate() - 7);
    setWeekAnchor(d);
  };

  const nextWeek = () => {
    const d = new Date(weekAnchor);
    d.setDate(d.getDate() + 7);
    setWeekAnchor(d);
  };

  const goToToday = () => {
    setWeekAnchor(today);
    setSelectedDate(today);
  };

  const totalEntries = entries.length;
  const thisWeekEntries = weekDays.reduce(
    (sum, d) => sum + getEntriesForDate(d).length,
    0
  );

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Day Tracker</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Log and review your daily activities
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingEntry(null);
            setModalOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Entry
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <p className="text-xs text-muted-foreground mb-1">Total Entries</p>
          <p className="font-display text-2xl font-bold text-foreground">{totalEntries}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <p className="text-xs text-muted-foreground mb-1">This Week</p>
          <p className="font-display text-2xl font-bold text-foreground">{thisWeekEntries}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs col-span-2 sm:col-span-1">
          <p className="text-xs text-muted-foreground mb-1">Today</p>
          <p className="font-display text-2xl font-bold text-foreground">
            {getEntriesForDate(today).length}
          </p>
        </div>
      </div>

      {/* Week Navigator */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            <span className="font-display font-semibold text-sm text-foreground">
              Week of {formatShortDate(weekDays[0])} – {formatShortDate(weekDays[6])}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={goToToday}>
              Today
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7">
          {weekDays.map((day) => {
            const dayEntries = getEntriesForDate(day);
            const isToday = isSameDay(day, today);
            const isSelected = isSameDay(day, selectedDate);
            const hasEntries = dayEntries.length > 0;

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`flex flex-col items-center gap-1 py-3 px-1 text-center transition-colors border-r border-border last:border-r-0 ${
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : isToday
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted/50 text-foreground'
                }`}
              >
                <span className="text-xs font-medium uppercase tracking-wide opacity-70">
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
                <span className={`font-display text-lg font-bold leading-none ${isSelected ? 'text-primary-foreground' : ''}`}>
                  {day.getDate()}
                </span>
                {hasEntries && (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isSelected ? 'bg-primary-foreground' : 'bg-primary'
                    }`}
                  />
                )}
                {!hasEntries && <span className="h-1.5 w-1.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Entries */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold text-foreground">
            {isSameDay(selectedDate, today) ? "Today's Entries" : formatDisplayDate(selectedDate)}
          </h2>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => {
              setEditingEntry(null);
              setModalOpen(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : selectedEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/10 py-12 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-medium text-muted-foreground">No entries for this day</p>
            <p className="text-xs text-muted-foreground/70 mt-0.5 mb-3">
              Track what you worked on to build a study log
            </p>
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => {
                setEditingEntry(null);
                setModalOpen(true);
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Entry
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedEntries.map((entry) => (
              <div
                key={String(entry.id)}
                className="group flex items-start gap-4 rounded-xl border border-border bg-card p-4 shadow-xs hover:shadow-card transition-all"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <BookOpen className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {entry.taskDescription}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDisplayDate(intToDate(entry.date))}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => {
                      setEditingEntry(entry);
                      setModalOpen(true);
                    }}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(entry)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
            <div className="flex justify-end">
              <Badge variant="secondary" className="text-xs">
                {selectedEntries.length} {selectedEntries.length === 1 ? 'entry' : 'entries'}
              </Badge>
            </div>
          </div>
        )}
      </div>

      {/* Entry Modal */}
      <EntryModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditingEntry(null);
        }}
        date={selectedDate}
        entry={editingEntry}
        onSave={handleSave}
        isSaving={savingEntry}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
