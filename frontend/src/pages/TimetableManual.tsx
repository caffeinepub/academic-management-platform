import { useState } from 'react';
import { Plus, Edit2, Trash2, Calendar, Loader2 } from 'lucide-react';
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
import TimetableSlotModal, { type SlotFormData } from '../components/TimetableSlotModal';
import type { TimetableSlot } from '../backend';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_ABBR: Record<string, string> = {
  Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu',
  Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun',
};

function formatTime(minutes: bigint): string {
  const total = Number(minutes);
  const h = Math.floor(total / 60);
  const m = total % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
}

function minutesToTimeString(minutes: bigint): string {
  const total = Number(minutes);
  const h = Math.floor(total / 60);
  const m = total % 60;
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
  const { data: slots = [], isLoading } = useGetAllSlots();
  const createSlot = useCreateSlot();
  const deleteSlot = useDeleteSlot();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TimetableSlot | null>(null);
  const [deletingId, setDeletingId] = useState<bigint | null>(null);

  const slotsByDay = DAYS.reduce<Record<string, TimetableSlot[]>>((acc, day) => {
    acc[day] = slots
      .filter((s) => s.dayOfWeek === day)
      .sort((a, b) => Number(a.startTime - b.startTime));
    return acc;
  }, {});

  const handleSave = async (data: SlotFormData) => {
    const [h, m] = data.startTime.split(':').map(Number);
    const startMinutes = BigInt(h * 60 + m);

    if (editingSlot) {
      // Edit = delete + recreate
      try {
        await deleteSlot.mutateAsync(editingSlot.id);
        await createSlot.mutateAsync({
          subject: data.subject,
          startTime: startMinutes,
          location: data.location,
          dayOfWeek: data.dayOfWeek,
          durationMinutes: BigInt(data.durationMinutes),
        });
        toast.success('Slot updated successfully');
      } catch {
        toast.error('Failed to update slot');
        throw new Error('Update failed');
      }
    } else {
      try {
        await createSlot.mutateAsync({
          subject: data.subject,
          startTime: startMinutes,
          location: data.location,
          dayOfWeek: data.dayOfWeek,
          durationMinutes: BigInt(data.durationMinutes),
        });
        toast.success('Slot added successfully');
      } catch {
        toast.error('Failed to add slot');
        throw new Error('Create failed');
      }
    }
    setEditingSlot(null);
  };

  const handleEdit = (slot: TimetableSlot) => {
    setEditingSlot(slot);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      await deleteSlot.mutateAsync(deleteTarget.id);
      toast.success('Slot deleted');
    } catch {
      toast.error('Failed to delete slot');
    } finally {
      setDeletingId(null);
      setDeleteTarget(null);
    }
  };

  const editInitialData: SlotFormData | undefined = editingSlot
    ? {
        subject: editingSlot.subject,
        dayOfWeek: editingSlot.dayOfWeek,
        startTime: minutesToTimeString(editingSlot.startTime),
        durationMinutes: Number(editingSlot.durationMinutes),
        location: editingSlot.location,
      }
    : undefined;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Weekly Timetable</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {slots.length} slot{slots.length !== 1 ? 's' : ''} across the week
          </p>
        </div>
        <Button
          onClick={() => { setEditingSlot(null); setModalOpen(true); }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Slot
        </Button>
      </div>

      {/* Weekly Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {DAYS.map((day) => (
            <Skeleton key={day} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {DAYS.map((day) => {
            const daySlots = slotsByDay[day];
            const isToday = day === today;
            return (
              <div
                key={day}
                className={`rounded-xl border-2 p-4 transition-shadow hover:shadow-card ${
                  isToday ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className={`h-4 w-4 ${isToday ? 'text-primary' : 'text-muted-foreground'}`} />
                    <h3 className={`font-display font-semibold text-sm ${isToday ? 'text-primary' : 'text-foreground'}`}>
                      {DAY_ABBR[day]}
                    </h3>
                    {isToday && (
                      <Badge className="text-xs py-0 px-1.5 h-4">Today</Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{daySlots.length} class{daySlots.length !== 1 ? 'es' : ''}</span>
                </div>

                {daySlots.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-4 text-center">
                    <p className="text-xs text-muted-foreground">No classes</p>
                    <button
                      onClick={() => {
                        setEditingSlot(null);
                        setModalOpen(true);
                      }}
                      className="mt-1 text-xs text-primary hover:underline"
                    >
                      + Add
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {daySlots.map((slot) => (
                      <div
                        key={String(slot.id)}
                        className={`group relative rounded-lg border p-2.5 ${DAY_COLORS[day] || 'bg-muted/30 border-border'}`}
                      >
                        <p className="text-xs font-semibold text-foreground truncate pr-12">{slot.subject}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatTime(slot.startTime)} · {Number(slot.durationMinutes)}m
                        </p>
                        {slot.location && (
                          <p className="text-xs text-muted-foreground truncate">{slot.location}</p>
                        )}
                        <div className="absolute right-1.5 top-1.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(slot)}
                            className="rounded p-1 hover:bg-background/80 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(slot)}
                            disabled={deletingId === slot.id}
                            className="rounded p-1 hover:bg-background/80 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            {deletingId === slot.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Slot Modal */}
      <TimetableSlotModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditingSlot(null);
        }}
        initialData={editInitialData}
        onSave={handleSave}
        mode={editingSlot ? 'edit' : 'add'}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Slot</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.subject}</strong> on{' '}
              {deleteTarget?.dayOfWeek}? This action cannot be undone.
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
