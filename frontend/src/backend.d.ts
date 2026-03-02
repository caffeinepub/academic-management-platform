import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Task {
    id: bigint;
    title: string;
    createdAt: Time;
    completed: boolean;
    dueDate?: Time;
    description: string;
}
export interface TimetableSlot {
    id: bigint;
    startTime: bigint;
    subject: string;
    dayOfWeek: string;
    createdAt: Time;
    durationMinutes: bigint;
    location: string;
}
export interface ChatMessage {
    id: bigint;
    content: string;
    sender: string;
    timestamp: Time;
}
export type Time = bigint;
export interface SidebarItem {
    id: bigint;
    title: string;
    icon: string;
    route: string;
}
export interface DayEntry {
    id: bigint;
    userId: string;
    date: bigint;
    createdAt: Time;
    taskDescription: string;
}
export interface backendInterface {
    /**
     * / Add a new day entry with the given details.
     * / Returns the newly created DayEntry.
     */
    addDayEntry(userId: string, date: bigint, taskDescription: string): Promise<DayEntry>;
    addSidebarItem(title: string, icon: string, route: string): Promise<SidebarItem>;
    createSlot(subject: string, startTime: bigint, location: string, dayOfWeek: string, durationMinutes: bigint): Promise<TimetableSlot>;
    createTask(title: string, dueDate: Time | null, description: string): Promise<Task>;
    /**
     * / Delete a day entry by its ID.
     */
    deleteDayEntry(entryId: bigint): Promise<void>;
    deleteSlot(slotId: bigint): Promise<void>;
    getAllMessages(): Promise<Array<ChatMessage>>;
    getAllSidebarItems(): Promise<Array<SidebarItem>>;
    getAllSlots(): Promise<Array<TimetableSlot>>;
    getAllTasks(): Promise<Array<Task>>;
    /**
     * / Get all day entries for a specific user.
     */
    getDayEntries(userId: string): Promise<Array<DayEntry>>;
    /**
     * / Get day entries for a user within a specific date range.
     */
    getDayEntriesByRange(userId: string, startDate: bigint, endDate: bigint): Promise<Array<DayEntry>>;
    markTaskAsCompleted(taskId: bigint): Promise<void>;
    sendMessage(sender: string, content: string): Promise<ChatMessage>;
    /**
     * / Update the task description of an existing day entry.
     */
    updateDayEntry(entryId: bigint, newDescription: string): Promise<DayEntry>;
}
