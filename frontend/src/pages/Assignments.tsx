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
  UserCircle,
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
import {
  useGetAllTasks,
  useCreateTask,
  useMarkTaskCompleted,
  useDeleteTask,
  useUpdateTask,
} from '../hooks/useQueries';
import type { LocalTask } from '../hooks/useQueries';
import TaskModal, { type TaskFormData } from '../components/TaskModal';
import { useUser } from '../contexts/UserContext';

type FilterType = 'all' | 'pending' | 'completed';

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getDaysUntil(dateStr: string): number {
  if (!dateStr) return Infinity;
  const due = new Date(dateStr + 'T00:00:00').getTime();
  return Math.ceil((due - Date.now()) / (1000 * 60 * 60 * 24));
}

export default function Assignments() {
  const { userId } = useUser();
  const { data: tasks = [], isLoading } = useGetAllTasks();
  const createTask = useCreateTask();
  const markCompleted = useMarkTaskCompleted();
  const deleteTask = useDeleteTask();
  const updateTask = useUpdateTask();

  const [filter, setFilter] = useState<FilterType>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<LocalTask | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LocalTask | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredTasks = useMemo(() => {
    let result = [...tasks];
    if (filter === 'pending') result = result.filter((t) => !t.completed);
    if (filter === 'completed') result = result.filter((t) => t.completed);
    return result.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return b.createdAt - a.createdAt;
    });
  }, [tasks, filter]);

  const pendingCount = tasks.filter((t) => !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed).length;

  const handleSave = async (data: TaskFormData) => {
    if (editingTask) {
      await updateTask.mutateAsync({
        id: editingTask.id,
        title: data.title,
        dueDate: data.dueDate,
        description: data.description,
      });
      toast.success('Task updated successfully');
    } else {
      await createTask.mutateAsync({
        title: data.title,
        dueDate: data.dueDate,
        description: data.description,
      });
      toast.success('Task added successfully');
    }
    setEditingTask(null);
  };

  const handleToggleComplete = async (task: LocalTask) => {
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

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      await deleteTask.mutateAsync(deleteTarget.id);
      toast.success('Task deleted');
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete task');
    } finally {
      setDeletingId(null);
    }
  };

  const editInitialData: TaskFormData | undefined = editingTask
    ? {
        title: editingTask.title,
        description: editingTask.description,
        dueDate: editingTask.dueDate,
      }
    : undefined;

  // No user state
  if (!userId) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <UserCircle className="h-16 w-16 text-muted-foreground/40" />
        <div>
          <h2 className="font-display text-xl font-semibold text-foreground">Sign in to view your tasks</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Your tasks are saved per user. Please set up your profile to get started.
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
          <h1 className="font-display text-2xl font-bold text-foreground">Assignments & Tasks</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {pendingCount} pending · {completedCount} completed
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingTask(null);
            setModalOpen(true);
          }}
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
              All{' '}
              <Badge variant="secondary" className="ml-1.5 text-xs py-0 px-1.5 h-4">
                {tasks.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-xs px-3 h-6">
              Pending{' '}
              <Badge variant="secondary" className="ml-1.5 text-xs py-0 px-1.5 h-4">
                {pendingCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs px-3 h-6">
              Completed{' '}
              <Badge variant="secondary" className="ml-1.5 text-xs py-0 px-1.5 h-4">
                {completedCount}
              </Badge>
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
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
          <ClipboardList className="h-12 w-12 text-muted-foreground/30" />
          <div>
            <p className="font-medium text-muted-foreground">
              {filter === 'all' ? 'No tasks yet' : `No ${filter} tasks`}
            </p>
            <p className="text-sm text-muted-foreground/70 mt-0.5">
              {filter === 'all' ? 'Click "Add Task" to create your first task.' : 'Try a different filter.'}
            </p>
          </div>
          {filter === 'all' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditingTask(null);
                setModalOpen(true);
              }}
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Task
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const daysUntil = task.dueDate ? getDaysUntil(task.dueDate) : null;
            const isOverdue = daysUntil !== null && daysUntil < 0 && !task.completed;
            const isUrgent = daysUntil !== null && daysUntil >= 0 && daysUntil <= 2 && !task.completed;
            const isCompleting = completingId === task.id;

            return (
              <div
                key={task.id}
                className={`group flex items-start gap-3 rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-card-hover ${
                  task.completed ? 'opacity-60' : ''
                } ${isOverdue ? 'border-destructive/40' : 'border-border'}`}
              >
                {/* Complete toggle */}
                <button
                  onClick={() => handleToggleComplete(task)}
                  disabled={task.completed || isCompleting}
                  className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors disabled:cursor-default"
                  aria-label={task.completed ? 'Completed' : 'Mark as complete'}
                >
                  {isCompleting ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : task.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <p
                      className={`text-sm font-medium leading-snug ${
                        task.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                      }`}
                    >
                      {task.title}
                    </p>
                    {isOverdue && (
                      <Badge variant="destructive" className="text-xs py-0 h-4">
                        Overdue
                      </Badge>
                    )}
                    {isUrgent && (
                      <Badge className="text-xs py-0 h-4 bg-amber-500 text-white">
                        Due soon
                      </Badge>
                    )}
                  </div>
                  {task.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  {task.dueDate && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Due {formatDate(task.dueDate)}
                      {daysUntil !== null && !task.completed && (
                        <span className={`ml-1 ${isOverdue ? 'text-destructive' : isUrgent ? 'text-amber-600' : ''}`}>
                          {daysUntil === 0
                            ? '(Today)'
                            : daysUntil === 1
                            ? '(Tomorrow)'
                            : daysUntil < 0
                            ? `(${Math.abs(daysUntil)}d ago)`
                            : `(in ${daysUntil}d)`}
                        </span>
                      )}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!task.completed && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setEditingTask(task);
                        setModalOpen(true);
                      }}
                      title="Edit task"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteTarget(task)}
                    title="Delete task"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Modal */}
      <TaskModal
        open={modalOpen}
        onOpenChange={(v) => {
          setModalOpen(v);
          if (!v) setEditingTask(null);
        }}
        initialData={editInitialData}
        onSave={handleSave}
        mode={editingTask ? 'edit' : 'add'}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove &ldquo;{deleteTarget?.title}&rdquo;. This action cannot be
              undone.
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
