import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '../contexts/UserContext';

// ─── Local Task Types ─────────────────────────────────────────────────────────

export interface LocalTask {
  id: string;
  title: string;
  description: string;
  dueDate: string; // ISO date string "YYYY-MM-DD" or ""
  completed: boolean;
  createdAt: number; // timestamp ms
}

// ─── Local Slot Types ─────────────────────────────────────────────────────────

export interface LocalSlot {
  id: string;
  subject: string;
  dayOfWeek: string;
  startTime: number; // minutes from midnight
  durationMinutes: number;
  location: string;
  createdAt: number;
}

// ─── Local Day Entry Types ────────────────────────────────────────────────────

export interface LocalDayEntry {
  id: string;
  date: string; // ISO date string YYYY-MM-DD
  hours: number;
  description: string;
  completed: boolean;
}

// ─── Storage Key Helpers ──────────────────────────────────────────────────────

function tasksKey(userId: string | null): string {
  return userId ? `acadmind_tasks_${userId}` : 'acadmind_tasks_guest';
}

function slotsKey(userId: string | null): string {
  return userId ? `acadmind_slots_${userId}` : 'acadmind_slots_guest';
}

function dayEntriesKey(userId: string | null): string {
  return userId ? `acadmind_day_entries_${userId}` : 'acadmind_day_entries_guest';
}

// ─── Generic localStorage helpers ────────────────────────────────────────────

function loadFromStorage<T>(key: string, migrateFn?: (raw: unknown[]) => T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    if (migrateFn) return migrateFn(parsed);
    return parsed as T[];
  } catch {
    return [];
  }
}

function saveToStorage<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore storage errors
  }
}

// ─── Tasks (localStorage) ─────────────────────────────────────────────────────

function loadTasks(userId: string | null): LocalTask[] {
  return loadFromStorage<LocalTask>(tasksKey(userId), (raw) =>
    (raw as Record<string, unknown>[]).map((e) => ({
      id: String(e.id ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`),
      title: typeof e.title === 'string' ? e.title : '',
      description: typeof e.description === 'string' ? e.description : '',
      dueDate: typeof e.dueDate === 'string' ? e.dueDate : '',
      completed: Boolean(e.completed ?? false),
      createdAt: typeof e.createdAt === 'number' ? e.createdAt : Date.now(),
    }))
  );
}

function saveTasks(userId: string | null, tasks: LocalTask[]): void {
  saveToStorage(tasksKey(userId), tasks);
}

export function useGetAllTasks() {
  const { userId } = useUser();
  return useQuery<LocalTask[]>({
    queryKey: ['tasks', userId],
    queryFn: () => loadTasks(userId),
    staleTime: 0,
  });
}

export function useCreateTask() {
  const { userId } = useUser();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { title: string; dueDate: string; description: string }) => {
      const tasks = loadTasks(userId);
      const newTask: LocalTask = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        title: params.title,
        description: params.description,
        dueDate: params.dueDate,
        completed: false,
        createdAt: Date.now(),
      };
      saveTasks(userId, [...tasks, newTask]);
      return newTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', userId] });
    },
  });
}

export function useMarkTaskCompleted() {
  const { userId } = useUser();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      const tasks = loadTasks(userId);
      const updated = tasks.map((t) =>
        t.id === taskId ? { ...t, completed: true } : t
      );
      saveTasks(userId, updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', userId] });
    },
  });
}

export function useDeleteTask() {
  const { userId } = useUser();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      const tasks = loadTasks(userId);
      saveTasks(userId, tasks.filter((t) => t.id !== taskId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', userId] });
    },
  });
}

export function useUpdateTask() {
  const { userId } = useUser();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; title: string; dueDate: string; description: string }) => {
      const tasks = loadTasks(userId);
      const updated = tasks.map((t) =>
        t.id === params.id
          ? { ...t, title: params.title, dueDate: params.dueDate, description: params.description }
          : t
      );
      saveTasks(userId, updated);
      return updated.find((t) => t.id === params.id)!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', userId] });
    },
  });
}

// ─── Slots (localStorage) ─────────────────────────────────────────────────────

function loadSlots(userId: string | null): LocalSlot[] {
  return loadFromStorage<LocalSlot>(slotsKey(userId), (raw) =>
    (raw as Record<string, unknown>[]).map((e) => ({
      id: String(e.id ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`),
      subject: typeof e.subject === 'string' ? e.subject : '',
      dayOfWeek: typeof e.dayOfWeek === 'string' ? e.dayOfWeek : '',
      startTime: typeof e.startTime === 'number' ? e.startTime : 0,
      durationMinutes: typeof e.durationMinutes === 'number' ? e.durationMinutes : 60,
      location: typeof e.location === 'string' ? e.location : '',
      createdAt: typeof e.createdAt === 'number' ? e.createdAt : Date.now(),
    }))
  );
}

function saveSlots(userId: string | null, slots: LocalSlot[]): void {
  saveToStorage(slotsKey(userId), slots);
}

export function useGetAllSlots() {
  const { userId } = useUser();
  return useQuery<LocalSlot[]>({
    queryKey: ['slots', userId],
    queryFn: () => loadSlots(userId),
    staleTime: 0,
  });
}

export function useCreateSlot() {
  const { userId } = useUser();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      subject: string;
      startTime: number; // minutes from midnight
      location: string;
      dayOfWeek: string;
      durationMinutes: number;
    }) => {
      const slots = loadSlots(userId);
      const newSlot: LocalSlot = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        subject: params.subject,
        dayOfWeek: params.dayOfWeek,
        startTime: params.startTime,
        durationMinutes: params.durationMinutes,
        location: params.location,
        createdAt: Date.now(),
      };
      saveSlots(userId, [...slots, newSlot]);
      return newSlot;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slots', userId] });
    },
  });
}

export function useDeleteSlot() {
  const { userId } = useUser();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (slotId: string) => {
      const slots = loadSlots(userId);
      saveSlots(userId, slots.filter((s) => s.id !== slotId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['slots', userId] });
    },
  });
}

// ─── Day Tracker (localStorage) ──────────────────────────────────────────────

function loadEntries(userId: string | null): LocalDayEntry[] {
  return loadFromStorage<LocalDayEntry>(dayEntriesKey(userId), (raw) =>
    (raw as Record<string, unknown>[]).map((e) => ({
      id: String(e.id ?? Math.random()),
      date: String(e.date ?? ''),
      hours: typeof e.hours === 'number' ? e.hours : 0,
      description:
        typeof e.description === 'string'
          ? e.description
          : typeof e.taskDescription === 'string'
          ? e.taskDescription
          : '',
      completed: Boolean(e.completed ?? false),
    }))
  );
}

function saveEntries(userId: string | null, entries: LocalDayEntry[]): void {
  saveToStorage(dayEntriesKey(userId), entries);
}

export function useGetDayEntries() {
  const { userId } = useUser();
  return useQuery<LocalDayEntry[]>({
    queryKey: ['day-entries', userId],
    queryFn: () => loadEntries(userId),
    staleTime: 0,
  });
}

export function useAddDayEntry() {
  const { userId } = useUser();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { date: string; hours: number; description: string }) => {
      const entries = loadEntries(userId);
      const newEntry: LocalDayEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        date: params.date,
        hours: params.hours,
        description: params.description,
        completed: false,
      };
      saveEntries(userId, [...entries, newEntry]);
      return newEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['day-entries', userId] });
    },
  });
}

export function useUpdateDayEntry() {
  const { userId } = useUser();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; hours: number; description: string }) => {
      const entries = loadEntries(userId);
      const updated = entries.map((e) =>
        e.id === params.id ? { ...e, hours: params.hours, description: params.description } : e
      );
      saveEntries(userId, updated);
      return updated.find((e) => e.id === params.id)!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['day-entries', userId] });
    },
  });
}

export function useDeleteDayEntry() {
  const { userId } = useUser();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const entries = loadEntries(userId);
      saveEntries(userId, entries.filter((e) => e.id !== id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['day-entries', userId] });
    },
  });
}
