import { useState, useRef, useCallback } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Loader2,
  Save,
  RefreshCw,
  CheckCircle2,
  X,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { timeStringToMinutes, type ExtractedSlot } from '../utils/mockOcr';
import { useCreateSlot } from '../hooks/useQueries';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DURATIONS = [30, 45, 60, 90, 120, 150, 180];

export default function TimetableUpload() {
  const [dragOver, setDragOver] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [extractedSlots, setExtractedSlots] = useState<ExtractedSlot[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createSlot = useCreateSlot();

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, WEBP)');
      return;
    }
    setImageFile(file);
    setExtractedSlots([]);
    setShowComingSoon(false);
    setSaved(false);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleExtract = async () => {
    if (!imageFile) return;
    setExtracting(true);
    setShowComingSoon(false);
    // Simulate a brief loading delay before showing "Coming Soon"
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setExtracting(false);
    setShowComingSoon(true);
  };

  const handleSlotChange = (index: number, field: keyof ExtractedSlot, value: string | number) => {
    setExtractedSlots((prev) =>
      prev.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot))
    );
  };

  const handleRemoveSlot = (index: number) => {
    setExtractedSlots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (extractedSlots.length === 0) return;
    setSaving(true);
    let successCount = 0;
    try {
      for (const slot of extractedSlots) {
        await createSlot.mutateAsync({
          subject: slot.subject,
          startTime: timeStringToMinutes(slot.startTime),
          location: slot.location,
          dayOfWeek: slot.dayOfWeek,
          durationMinutes: slot.durationMinutes,
        });
        successCount++;
      }
      toast.success(`Saved ${successCount} slots to your timetable`);
      setSaved(true);
    } catch {
      toast.error(`Saved ${successCount}/${extractedSlots.length} slots. Some failed.`);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setImageFile(null);
    setImagePreview(null);
    setExtractedSlots([]);
    setShowComingSoon(false);
    setSaved(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">OCR Timetable Upload</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Upload a photo of your timetable and we'll extract the schedule automatically
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload Area */}
        <div className="space-y-4">
          <h2 className="font-display font-semibold text-foreground">1. Upload Image</h2>

          {!imagePreview ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 cursor-pointer transition-all ${
                dragOver
                  ? 'border-primary bg-primary/5 scale-[1.01]'
                  : 'border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40'
              }`}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-4">
                <Upload className="h-7 w-7 text-primary" />
              </div>
              <p className="font-medium text-foreground mb-1">Drop your timetable image here</p>
              <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
              <Badge variant="secondary">PNG · JPG · WEBP</Badge>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden border border-border bg-muted/20">
                <img
                  src={imagePreview}
                  alt="Uploaded timetable"
                  className="w-full object-contain max-h-64"
                />
                <button
                  onClick={handleReset}
                  className="absolute top-2 right-2 rounded-full bg-background/90 p-1.5 shadow-sm hover:bg-background transition-colors"
                >
                  <X className="h-4 w-4 text-foreground" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground truncate">{imageFile?.name}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleExtract}
                  disabled={extracting || saved}
                  className="flex-1 gap-2"
                >
                  {extracting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Extracting...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Extract Timetable
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleReset} size="icon">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Extracted Slots / Coming Soon */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-foreground">2. Review & Edit</h2>
            {extractedSlots.length > 0 && (
              <Badge variant="secondary">{extractedSlots.length} slots</Badge>
            )}
          </div>

          {showComingSoon ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-10 text-center space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <Sparkles className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="font-display font-semibold text-foreground text-lg">Coming Soon</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                  OCR timetable extraction is under development. In the meantime, use the{' '}
                  <strong>Manual Timetable</strong> page to add your schedule.
                </p>
              </div>
              <Badge variant="outline" className="text-primary border-primary/40">
                🚧 Feature in progress
              </Badge>
            </div>
          ) : extractedSlots.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/10 p-10 text-center space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-muted-foreground">No slots extracted yet</p>
                <p className="text-sm text-muted-foreground/70 mt-0.5">
                  Upload an image and click "Extract Timetable"
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {extractedSlots.map((slot, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      Slot {index + 1}
                    </Badge>
                    <button
                      onClick={() => handleRemoveSlot(index)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <Input
                        value={slot.subject}
                        onChange={(e) => handleSlotChange(index, 'subject', e.target.value)}
                        placeholder="Subject"
                        className="text-sm"
                      />
                    </div>
                    <Select
                      value={slot.dayOfWeek}
                      onValueChange={(v) => handleSlotChange(index, 'dayOfWeek', v)}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) => handleSlotChange(index, 'startTime', e.target.value)}
                      className="text-sm"
                    />
                    <Select
                      value={String(slot.durationMinutes)}
                      onValueChange={(v) =>
                        handleSlotChange(index, 'durationMinutes', Number(v))
                      }
                    >
                      <SelectTrigger className="text-sm">
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
                    <Input
                      value={slot.location}
                      onChange={(e) => handleSlotChange(index, 'location', e.target.value)}
                      placeholder="Location (optional)"
                      className="text-sm"
                    />
                  </div>
                </div>
              ))}

              {/* Save button */}
              {!saved ? (
                <Button
                  onClick={handleSave}
                  disabled={saving || extractedSlots.length === 0}
                  className="w-full gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving {extractedSlots.length} slots...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save {extractedSlots.length} Slots to Timetable
                    </>
                  )}
                </Button>
              ) : (
                <div className="flex items-center justify-center gap-2 rounded-xl bg-primary/10 py-3 text-sm font-medium text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                  Slots saved successfully!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
