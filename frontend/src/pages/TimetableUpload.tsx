import { useState, useRef, useCallback } from 'react';
import { Upload, Image as ImageIcon, Loader2, Save, RefreshCw, CheckCircle2, X } from 'lucide-react';
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
import { mockExtractTimetable, timeStringToMinutes, type ExtractedSlot } from '../utils/mockOcr';
import { useCreateSlot } from '../hooks/useQueries';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DURATIONS = [30, 45, 60, 90, 120, 150, 180];

export default function TimetableUpload() {
  const [dragOver, setDragOver] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
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
    try {
      const slots = await mockExtractTimetable(imageFile);
      setExtractedSlots(slots);
      toast.success(`Extracted ${slots.length} slots from your timetable`);
    } catch {
      toast.error('Extraction failed. Please try again.');
    } finally {
      setExtracting(false);
    }
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
          durationMinutes: BigInt(slot.durationMinutes),
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
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
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

        {/* Extracted Slots */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-foreground">2. Review & Edit</h2>
            {extractedSlots.length > 0 && (
              <Badge variant="secondary">{extractedSlots.length} slots</Badge>
            )}
          </div>

          {extractedSlots.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/10 p-12 text-center">
              <ImageIcon className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                {imagePreview
                  ? 'Click "Extract Timetable" to process your image'
                  : 'Upload an image first, then extract the timetable'}
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[480px] overflow-y-auto scrollbar-thin pr-1">
              {extractedSlots.map((slot, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-border bg-card p-3 space-y-2 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">Slot {index + 1}</Badge>
                    <button
                      onClick={() => handleRemoveSlot(index)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Subject</label>
                      <Input
                        value={slot.subject}
                        onChange={(e) => handleSlotChange(index, 'subject', e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Day</label>
                      <Select
                        value={slot.dayOfWeek}
                        onValueChange={(v) => handleSlotChange(index, 'dayOfWeek', v)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DAYS.map((d) => (
                            <SelectItem key={d} value={d} className="text-xs">{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Start Time</label>
                      <Input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => handleSlotChange(index, 'startTime', e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Duration</label>
                      <Select
                        value={String(slot.durationMinutes)}
                        onValueChange={(v) => handleSlotChange(index, 'durationMinutes', Number(v))}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DURATIONS.map((d) => (
                            <SelectItem key={d} value={String(d)} className="text-xs">
                              {d >= 60 ? `${d / 60}h${d % 60 ? ` ${d % 60}m` : ''}` : `${d}m`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-muted-foreground mb-1 block">Location</label>
                      <Input
                        value={slot.location}
                        onChange={(e) => handleSlotChange(index, 'location', e.target.value)}
                        className="h-8 text-xs"
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {extractedSlots.length > 0 && (
            <Button
              onClick={handleSave}
              disabled={saving || saved}
              className="w-full gap-2"
              variant={saved ? 'secondary' : 'default'}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving {extractedSlots.length} slots...
                </>
              ) : saved ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Saved to Timetable
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save {extractedSlots.length} Slots to Timetable
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
