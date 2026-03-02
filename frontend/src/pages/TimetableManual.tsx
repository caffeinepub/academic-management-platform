import { useState } from 'react';
import { Plus, Edit2, Trash2, Calendar, Loader2, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import { useGetAllSlots, useCreateSlot, useDeleteSlot } from '../hooks/useQueries';
import type { LocalSlot } from '../hooks/useQueries';
import TimetableSlotModal, { type SlotFormData } from '../components/TimetableSlotModal';
import { useUser } from '../contexts/UserContext';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_ABBR: Record<string, string> = {
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
  Sunday: 'Sun',
};

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
}

function timeStringToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + (m || 0);
}

function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

const DAY_COLORS: Record<string, string> = {
  Monday: 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800',
  Tuesday: 'bg-purple-50 border-purple-200 dark:bg-purple-950/30 dark:border-purple-800',
  Wednesday: 'bg-teal-50 border-teal-200 dark:bg-teal-950/30 dark:border-teal-800',
  Thursday: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800',
  Friday: 'bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800',
  Saturday: 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800',
  Sunday: 'bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800',
};

export default function TimetableManual() {
  const { userId } = useUser();
  const { data: slots = [], isLoading } = useGetAllSlots();
  const createSlot = useCreateSlot();
  const deleteSlot = useDeleteSlot();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<LocalSlot | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LocalSlot | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const slotsByDay = DAYS.reduce<Record<string, LocalSlot[]>>((acc, day) => {
    acc[day] = slots
      .filter((s) => s.dayOfWeek === day)
      .sort((a, b) => a.startTime - b.startTime);
    return acc;
  }, {});

  const handleSave = async (data: SlotFormData) => {
    const startMinutes = timeStringToMinutes(data.startTime);
    if (editingSlot) {
      // No update endpoint — delete old and create new
      await deleteSlot.mutateAsync(editingSlot.id);
    }
    await createSlot.mutateAsync({
      subject: data.subject,
      startTime: startMinutes,
      location: data.location,
      dayOfWeek: data.dayOfWeek,
      durationMinutes: data.durationMinutes,
    });
    toast.success(editingSlot ? 'Slot updated' : 'Slot added');
    setEditingSlot(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      await deleteSlot.mutateAsync(deleteTarget.id);
      toast.success('Slot deleted');
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete slot');
    } finally {
      setDeletingId(null);
    }
  };

  const editInitialData: SlotFormData | undefined = editingSlot
    ? {
        subject: editingSlot.subject,
        dayOfWeek: editingSlot.dayOfWeek,
        startTime: minutesToTimeString(editingSlot.startTime),
        durationMinutes: editingSlot.durationMinutes,
        location: editingSlot.location,
      }
    : undefined;

  // No user state
  if (!userId) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <UserCircle className="h-16 w-16 text-muted-foreground/40" />
        <div>
          <h2 className="font-display text-xl font-semibold text-foreground">Sign in to manage your timetable</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Your timetable is saved per user. Please set up your profile to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Weekly Timetable</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {slots.length} slot{slots.length !== 1 ? 's' : ''} scheduled
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingSlot(null);
            setModalOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Slot
        </Button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ) : slots.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
          <Calendar className="h-12 w-12 text-muted-foreground/30" />
          <div>
            <p className="font-medium text-muted-foreground">No slots yet</p>
            <p className="text-sm text-muted-foreground/70 mt-0.5">
              Click "Add Slot" to schedule your first class.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditingSlot(null);
              setModalOpen(true);
            }}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Slot
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {DAYS.filter((day) => slotsByDay[day].length > 0).map((day) => (
            <div key={day} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {DAY_ABBR[day]}
                </span>
                <Badge variant="secondary" className="text-xs py-0 h-4">
                  {slotsByDay[day].length}
                </Badge>
              </div>
              {slotsByDay[day].map((slot) => (
                <div
                  key={slot.id}
                  className={`group relative rounded-xl border p-3 transition-all hover:shadow-card-hover ${DAY_COLORS[day] ?? 'bg-muted border-border'}`}
                >
                  <p className="text-sm font-semibold text-foreground truncate">{slot.subject}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatTime(slot.startTime)} · {slot.durationMinutes}m
                  </p>
                  {slot.location && (
                    <p className="text-xs text-muted-foreground truncate">{slot.location}</p>
                  )}
                  {/* Actions */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 bg-background/80 hover:bg-background"
                      onClick={() => {
                        setEditingSlot(slot);
                        setModalOpen(true);
                      }}
                      title="Edit slot"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 bg-background/80 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => setDeleteTarget(slot)}
                      title="Delete slot"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Slot Modal */}
      <TimetableSlotModal
        open={modalOpen}
        onOpenChange={(v) => {
          setModalOpen(v);
          if (!v) setEditingSlot(null);
        }}
        initialData={editInitialData}
        onSave={handleSave}
        mode={editingSlot ? 'edit' : 'add'}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Slot?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove &ldquo;{deleteTarget?.subject}&rdquo; from your timetable.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
              disabled={!!deletingId}
            >
              {deletingId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
