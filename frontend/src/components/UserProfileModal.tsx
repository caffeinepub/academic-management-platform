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
import { UserCircle, LogOut } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { toast } from 'sonner';

interface UserProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UserProfileModal({ open, onOpenChange }: UserProfileModalProps) {
  const { userId, updateUserId, clearUserId, geminiApiKey, updateGeminiApiKey, clearGeminiApiKey } =
    useUser();
  const [nameInput, setNameInput] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    if (open) {
      setNameInput(userId ?? '');
      setApiKeyInput(geminiApiKey ?? '');
      setNameError('');
    }
  }, [open, userId, geminiApiKey]);

  const handleSave = () => {
    if (!nameInput.trim()) {
      setNameError('Name or email is required');
      return;
    }
    updateUserId(nameInput.trim());
    if (apiKeyInput.trim()) {
      updateGeminiApiKey(apiKeyInput.trim());
    } else {
      clearGeminiApiKey();
    }
    toast.success('Profile saved');
    onOpenChange(false);
  };

  const handleLogout = () => {
    clearUserId();
    clearGeminiApiKey();
    toast.success('Signed out');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <UserCircle className="h-5 w-5 text-primary" />
            {userId ? 'Your Profile' : 'Set Up Profile'}
          </DialogTitle>
          <DialogDescription>
            Your name/email is used to keep your data separate from other users on this device.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="profile-name">Name or Email *</Label>
            <Input
              id="profile-name"
              value={nameInput}
              onChange={(e) => {
                setNameInput(e.target.value);
                if (nameError) setNameError('');
              }}
              placeholder="e.g. alice@example.com"
              className={nameError ? 'border-destructive' : ''}
            />
            {nameError && <p className="text-xs text-destructive">{nameError}</p>}
            <p className="text-xs text-muted-foreground">
              This is stored locally and used to namespace your data.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="profile-apikey">Gemini API Key (optional)</Label>
            <Input
              id="profile-apikey"
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="AIza..."
            />
            <p className="text-xs text-muted-foreground">
              Required for the AI Chat feature. Get yours at{' '}
              <a
                href="https://aistudio.google.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-primary"
              >
                aistudio.google.com
              </a>
              .
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {userId && (
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive border-destructive/30 hover:border-destructive sm:mr-auto"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Profile</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
