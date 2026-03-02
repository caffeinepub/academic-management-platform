import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { TimetableSlot, Task, ChatMessage } from '../backend';

// ─── Timetable Slots ────────────────────────────────────────────────────────

export function useGetAllSlots() {
  const { actor, isFetching } = useActor();
  return useQuery<TimetableSlot[]>({
    queryKey: ['slots'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllSlots();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateSlot() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      subject: string;
      startTime: bigint;
      location: string;
      dayOfWeek: string;
      durationMinutes: bigint;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.createSlot(
        params.subject,
        params.startTime,
        params.location,
        params.dayOfWeek,
        params.durationMinutes
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slots'] });
    },
  });
}

export function useDeleteSlot() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (slotId: bigint) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.deleteSlot(slotId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slots'] });
    },
  });
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export function useGetAllTasks() {
  const { actor, isFetching } = useActor();
  return useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllTasks();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateTask() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      title: string;
      dueDate: bigint | null;
      description: string;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.createTask(params.title, params.dueDate, params.description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useMarkTaskCompleted() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: bigint) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.markTaskAsCompleted(taskId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

// ─── Chat Messages ────────────────────────────────────────────────────────────

export function useGetAllMessages() {
  const { actor, isFetching } = useActor();
  return useQuery<ChatMessage[]>({
    queryKey: ['messages'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMessages();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { sender: string; content: string }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.sendMessage(params.sender, params.content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}

// ─── Day Tracker (localStorage) ──────────────────────────────────────────────

const LS_KEY = 'acadmind_day_entries';

export interface LocalDayEntry {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  hours: number;
  description: string;
  completed: boolean;
}

function loadEntries(): LocalDayEntry[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Migrate old entries that may have taskDescription instead of hours/description
    return parsed.map((e: Record<string, unknown>) => ({
      id: String(e.id ?? Math.random()),
      date: String(e.date ?? ''),
      hours: typeof e.hours === 'number' ? e.hours : 0,
      description: typeof e.description === 'string' ? e.description : (typeof e.taskDescription === 'string' ? e.taskDescription : ''),
      completed: Boolean(e.completed ?? false),
    }));
  } catch {
    return [];
  }
}

function saveEntries(entries: LocalDayEntry[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(entries));
}

export function useGetDayEntries() {
  return useQuery<LocalDayEntry[]>({
    queryKey: ['day-entries'],
    queryFn: () => loadEntries(),
    staleTime: 0,
  });
}

export function useAddDayEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { date: string; hours: number; description: string }) => {
      const entries = loadEntries();
      const newEntry: LocalDayEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        date: params.date,
        hours: params.hours,
        description: params.description,
        completed: false,
      };
      saveEntries([...entries, newEntry]);
      return newEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['day-entries'] });
    },
  });
}

export function useUpdateDayEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; hours: number; description: string }) => {
      const entries = loadEntries();
      const updated = entries.map((e) =>
        e.id === params.id ? { ...e, hours: params.hours, description: params.description } : e
      );
      saveEntries(updated);
      return updated.find((e) => e.id === params.id)!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['day-entries'] });
    },
  });
}

export function useDeleteDayEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const entries = loadEntries();
      saveEntries(entries.filter((e) => e.id !== id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['day-entries'] });
    },
  });
}
