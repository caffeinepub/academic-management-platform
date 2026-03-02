import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { TimetableSlot, Task, ChatMessage, DayEntry } from '../backend';

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

export function useMarkTaskAsCompleted() {
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

// ─── Chat ────────────────────────────────────────────────────────────────────

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

// ─── Day Tracker ─────────────────────────────────────────────────────────────

export function useGetDayEntries(userId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<DayEntry[]>({
    queryKey: ['dayEntries', userId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getDayEntries(userId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetDayEntriesByRange(userId: string, startDate: bigint, endDate: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<DayEntry[]>({
    queryKey: ['dayEntries', userId, 'range', String(startDate), String(endDate)],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getDayEntriesByRange(userId, startDate, endDate);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddDayEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      userId: string;
      date: bigint;
      taskDescription: string;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.addDayEntry(params.userId, params.date, params.taskDescription);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dayEntries', variables.userId] });
    },
  });
}

export function useUpdateDayEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { entryId: bigint; newDescription: string }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.updateDayEntry(params.entryId, params.newDescription);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dayEntries'] });
    },
  });
}

export function useDeleteDayEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entryId: bigint) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.deleteDayEntry(entryId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dayEntries'] });
    },
  });
}
