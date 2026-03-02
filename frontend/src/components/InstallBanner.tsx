import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'acadmind_pwa_dismissed';

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed
    if (localStorage.getItem(DISMISSED_KEY) === 'true') return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setVisible(false);
    setDeferredPrompt(null);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-xl border border-border bg-card shadow-card-hover px-4 py-3 flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Download className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground leading-tight">Install AcadMind</p>
        <p className="text-xs text-muted-foreground leading-tight mt-0.5">Use offline on your device</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          onClick={handleInstall}
          className="h-8 px-3 text-xs"
        >
          Install
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleDismiss}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          aria-label="Dismiss install banner"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
