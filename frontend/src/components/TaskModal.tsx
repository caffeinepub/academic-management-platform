import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

export interface TaskFormData {
  title: string;
  description: string;
  dueDate: string; // ISO date string "YYYY-MM-DD" or ""
}

interface TaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: TaskFormData;
  onSave: (data: TaskFormData) => Promise<void>;
  mode: 'add' | 'edit';
}

export default function TaskModal({
  open,
  onOpenChange,
  initialData,
  onSave,
  mode,
}: TaskModalProps) {
  const [form, setForm] = useState<TaskFormData>({
    title: '',
    description: '',
    dueDate: '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<TaskFormData>>({});

  useEffect(() => {
    if (open) {
      setForm(initialData ?? { title: '', description: '', dueDate: '' });
      setErrors({});
    }
  }, [open, initialData]);

  const validate = (): boolean => {
    const newErrors: Partial<TaskFormData> = {};
    if (!form.title.trim()) newErrors.title = 'Title is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave(form);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {mode === 'add' ? 'Add Task' : 'Edit Task'}
          </DialogTitle>
          <DialogDescription>
            Track your assignments, quizzes, and deadlines.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Math Assignment 3"
              className={errors.title ? 'border-destructive' : ''}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description / Remarks</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Add notes, chapter references, or instructions..."
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'add' ? 'Add Task' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
