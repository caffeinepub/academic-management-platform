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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

export interface SlotFormData {
  subject: string;
  dayOfWeek: string;
  startTime: string; // "HH:MM"
  durationMinutes: number;
  location: string;
}

interface TimetableSlotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: SlotFormData;
  onSave: (data: SlotFormData) => Promise<void>;
  mode: 'add' | 'edit';
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DURATIONS = [30, 45, 60, 90, 120, 150, 180];

export default function TimetableSlotModal({
  open,
  onOpenChange,
  initialData,
  onSave,
  mode,
}: TimetableSlotModalProps) {
  const [form, setForm] = useState<SlotFormData>({
    subject: '',
    dayOfWeek: 'Monday',
    startTime: '09:00',
    durationMinutes: 60,
    location: '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<SlotFormData>>({});

  useEffect(() => {
    if (open) {
      setForm(
        initialData ?? {
          subject: '',
          dayOfWeek: 'Monday',
          startTime: '09:00',
          durationMinutes: 60,
          location: '',
        }
      );
      setErrors({});
    }
  }, [open, initialData]);

  const validate = (): boolean => {
    const newErrors: Partial<SlotFormData> = {};
    if (!form.subject.trim()) newErrors.subject = 'Subject is required';
    if (!form.startTime) newErrors.startTime = 'Start time is required';
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
            {mode === 'add' ? 'Add Timetable Slot' : 'Edit Timetable Slot'}
          </DialogTitle>
          <DialogDescription>
            Fill in the details for your class slot.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              placeholder="e.g. Mathematics"
              className={errors.subject ? 'border-destructive' : ''}
            />
            {errors.subject && <p className="text-xs text-destructive">{errors.subject}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Day *</Label>
              <Select
                value={form.dayOfWeek}
                onValueChange={(v) => setForm((f) => ({ ...f, dayOfWeek: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="startTime">Start Time *</Label>
              <Input
                id="startTime"
                type="time"
                value={form.startTime}
                onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                className={errors.startTime ? 'border-destructive' : ''}
              />
              {errors.startTime && <p className="text-xs text-destructive">{errors.startTime}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Duration</Label>
              <Select
                value={String(form.durationMinutes)}
                onValueChange={(v) => setForm((f) => ({ ...f, durationMinutes: Number(v) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATIONS.map((d) => (
                    <SelectItem key={d} value={String(d)}>
                      {d >= 60 ? `${d / 60}h${d % 60 ? ` ${d % 60}m` : ''}` : `${d}m`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="e.g. Room 101"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'add' ? 'Add Slot' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
