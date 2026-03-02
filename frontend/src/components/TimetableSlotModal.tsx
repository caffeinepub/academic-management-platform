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
    startTime: '08:00',
    durationMinutes: 60,
    location: '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof SlotFormData, string>>>({});

  useEffect(() => {
    if (open) {
      setForm(
        initialData ?? {
          subject: '',
          dayOfWeek: 'Monday',
          startTime: '08:00',
          durationMinutes: 60,
          location: '',
        }
      );
      setErrors({});
      setSaving(false);
    }
  }, [open, initialData]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof SlotFormData, string>> = {};
    if (!form.subject.trim()) newErrors.subject = 'Subject is required';
    if (!form.dayOfWeek) newErrors.dayOfWeek = 'Day is required';
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
    } catch {
      // error handled by caller
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!saving) onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {mode === 'add' ? 'Add Timetable Slot' : 'Edit Timetable Slot'}
          </DialogTitle>
          <DialogDescription>
            Schedule a class or study session in your weekly timetable.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Subject */}
          <div className="space-y-1.5">
            <Label htmlFor="slot-subject">Subject *</Label>
            <Input
              id="slot-subject"
              value={form.subject}
              onChange={(e) => {
                setForm((f) => ({ ...f, subject: e.target.value }));
                if (errors.subject) setErrors((p) => ({ ...p, subject: undefined }));
              }}
              placeholder="e.g. Mathematics"
              className={errors.subject ? 'border-destructive' : ''}
              disabled={saving}
            />
            {errors.subject && <p className="text-xs text-destructive">{errors.subject}</p>}
          </div>

          {/* Day */}
          <div className="space-y-1.5">
            <Label htmlFor="slot-day">Day *</Label>
            <Select
              value={form.dayOfWeek}
              onValueChange={(v) => setForm((f) => ({ ...f, dayOfWeek: v }))}
              disabled={saving}
            >
              <SelectTrigger id="slot-day" className={errors.dayOfWeek ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.dayOfWeek && <p className="text-xs text-destructive">{errors.dayOfWeek}</p>}
          </div>

          {/* Start Time */}
          <div className="space-y-1.5">
            <Label htmlFor="slot-time">Start Time *</Label>
            <Input
              id="slot-time"
              type="time"
              value={form.startTime}
              onChange={(e) => {
                setForm((f) => ({ ...f, startTime: e.target.value }));
                if (errors.startTime) setErrors((p) => ({ ...p, startTime: undefined }));
              }}
              className={errors.startTime ? 'border-destructive' : ''}
              disabled={saving}
            />
            {errors.startTime && <p className="text-xs text-destructive">{errors.startTime}</p>}
          </div>

          {/* Duration */}
          <div className="space-y-1.5">
            <Label htmlFor="slot-duration">Duration</Label>
            <Select
              value={String(form.durationMinutes)}
              onValueChange={(v) => setForm((f) => ({ ...f, durationMinutes: Number(v) }))}
              disabled={saving}
            >
              <SelectTrigger id="slot-duration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DURATIONS.map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    {d >= 60
                      ? `${Math.floor(d / 60)}h${d % 60 ? ` ${d % 60}m` : ''}`
                      : `${d}m`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label htmlFor="slot-location">Location</Label>
            <Input
              id="slot-location"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="e.g. Room 101"
              disabled={saving}
            />
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
