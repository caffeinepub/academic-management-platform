import { useState, useMemo } from 'react';
import {
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Edit2,
  ClipboardList,
  Loader2,
  Filter,
} from 'lucide-react';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useGetAllTasks, useCreateTask, useMarkTaskAsCompleted } from '../hooks/useQueries';
import TaskModal, { type TaskFormData } from '../components/TaskModal';
import type { Task } from '../backend';

type FilterType = 'all' | 'pending' | 'completed';

function formatDate(ns: bigint): string {
  const ms = Number(ns / BigInt(1_000_000));
  return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getDaysUntil(ns: bigint): number {
  const ms = Number(ns / BigInt(1_000_000));
  return Math.ceil((ms - Date.now()) / (1000 * 60 * 60 * 24));
}

function dateStringToNs(dateStr: string): bigint {
  if (!dateStr) return 0n;
  const ms = new Date(dateStr).getTime();
  return BigInt(ms) * BigInt(1_000_000);
}

function nsToDateString(ns: bigint): string {
  if (!ns) return '';
  const ms = Number(ns / BigInt(1_000_000));
  const d = new Date(ms);
  return d.toISOString().split('T')[0];
}

export default function Assignments() {
  const { data: tasks = [], isLoading } = useGetAllTasks();
  const createTask = useCreateTask();
  const markCompleted = useMarkTaskAsCompleted();

  const [filter, setFilter] = useState<FilterType>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [completingId, setCompletingId] = useState<bigint | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);

  const filteredTasks = useMemo(() => {
    let result = [...tasks];
    if (filter === 'pending') result = result.filter((t) => !t.completed);
    if (filter === 'completed') result = result.filter((t) => t.completed);
    return result.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      if (a.dueDate && b.dueDate) return Number(a.dueDate - b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return 0;
    });
  }, [tasks, filter]);

  const pendingCount = tasks.filter((t) => !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed).length;

  const handleSave = async (data: TaskFormData) => {
    if (editingTask) {
      // Edit = mark complete + recreate (backend doesn't have updateTask)
      // We just create a new task since there's no update endpoint
      try {
        await createTask.mutateAsync({
          title: data.title,
          dueDate: data.dueDate ? dateStringToNs(data.dueDate) : null,
          description: data.description,
        });
        toast.success('Task updated (new entry created)');
      } catch {
        toast.error('Failed to save task');
        throw new Error('Save failed');
      }
    } else {
      try {
        await createTask.mutateAsync({
          title: data.title,
          dueDate: data.dueDate ? dateStringToNs(data.dueDate) : null,
          description: data.description,
        });
        toast.success('Task added successfully');
      } catch {
        toast.error('Failed to add task');
        throw new Error('Create failed');
      }
    }
    setEditingTask(null);
  };

  const handleToggleComplete = async (task: Task) => {
    if (task.completed) return;
    setCompletingId(task.id);
    try {
      await markCompleted.mutateAsync(task.id);
      toast.success(`"${task.title}" marked as completed`);
    } catch {
      toast.error('Failed to update task');
    } finally {
      setCompletingId(null);
    }
  };

  const editInitialData: TaskFormData | undefined = editingTask
    ? {
        title: editingTask.title,
        description: editingTask.description,
        dueDate: editingTask.dueDate ? nsToDateString(editingTask.dueDate) : '',
      }
    : undefined;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Assignments & Tasks</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {pendingCount} pending · {completedCount} completed
          </p>
        </div>
        <Button
          onClick={() => { setEditingTask(null); setModalOpen(true); }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Task
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
          <TabsList className="h-8">
            <TabsTrigger value="all" className="text-xs px-3 h-6">
              All <Badge variant="secondary" className="ml-1.5 text-xs py-0 px-1.5 h-4">{tasks.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-xs px-3 h-6">
              Pending <Badge variant="secondary" className="ml-1.5 text-xs py-0 px-1.5 h-4">{pendingCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs px-3 h-6">
              Completed <Badge variant="secondary" className="ml-1.5 text-xs py-0 px-1.5 h-4">{completedCount}</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Task List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/10 py-16 text-center">
          <ClipboardList className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <h3 className="font-display font-semibold text-foreground mb-1">
            {filter === 'all' ? 'No tasks yet' : `No ${filter} tasks`}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {filter === 'all'
              ? 'Add your first assignment or quiz to get started'
              : `You have no ${filter} tasks right now`}
          </p>
          {filter === 'all' && (
            <Button
              size="sm"
              onClick={() => { setEditingTask(null); setModalOpen(true); }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const daysUntil = task.dueDate ? getDaysUntil(task.dueDate) : null;
            const isOverdue = daysUntil !== null && daysUntil < 0 && !task.completed;
            const isUrgent = daysUntil !== null && daysUntil <= 2 && daysUntil >= 0 && !task.completed;

            return (
              <div
                key={String(task.id)}
                className={`group flex items-start gap-4 rounded-xl border bg-card p-4 shadow-xs transition-all hover:shadow-card ${
                  task.completed
                    ? 'opacity-60 border-border'
                    : isOverdue
                    ? 'border-destructive/30 bg-destructive/5'
                    : isUrgent
                    ? 'border-amber-300/50 bg-amber-50/50 dark:bg-amber-950/20'
                    : 'border-border'
                }`}
              >
                {/* Complete toggle */}
                <button
                  onClick={() => handleToggleComplete(task)}
                  disabled={task.completed || completingId === task.id}
                  className="mt-0.5 shrink-0 transition-colors"
                >
                  {completingId === task.id ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : task.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`font-medium text-sm leading-snug ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-1 shrink-0">
                      {task.completed ? (
                        <Badge variant="secondary" className="text-xs">Done</Badge>
                      ) : isOverdue ? (
                        <Badge variant="destructive" className="text-xs">Overdue</Badge>
                      ) : isUrgent ? (
                        <Badge className="text-xs bg-amber-500 hover:bg-amber-500">
                          {daysUntil === 0 ? 'Due Today' : 'Due Soon'}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Pending</Badge>
                      )}
                    </div>
                  </div>

                  {task.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                  )}

                  <div className="flex items-center gap-3 mt-2">
                    {task.dueDate && (
                      <span className={`text-xs ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                        Due {formatDate(task.dueDate)}
                        {daysUntil !== null && !task.completed && (
                          <span className="ml-1">
                            ({daysUntil === 0 ? 'today' : daysUntil < 0 ? `${Math.abs(daysUntil)}d ago` : `in ${daysUntil}d`})
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  {!task.completed && (
                    <button
                      onClick={() => { setEditingTask(task); setModalOpen(true); }}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteTarget(task)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Modal */}
      <TaskModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditingTask(null);
        }}
        initialData={editInitialData}
        onSave={handleSave}
        mode={editingTask ? 'edit' : 'add'}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.title}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                // Backend doesn't have deleteTask, so we just close
                toast.info('Task removal is not supported by the backend yet');
                setDeleteTarget(null);
              }}
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
